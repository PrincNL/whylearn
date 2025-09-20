import { promises as fs } from 'fs';
import type { FileHandle } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

import { datasetDefinitions, datasetList } from '../datasets';
import type {
  StorageAdapter,
  TransactionOptions,
  TransactionResult,
  JournalEntrySummary,
  ValidationReport,
  ValidationIssue,
  ImportOptions,
} from '../StorageAdapter';
import type { BaseRecord, DatasetDefinition, DatasetName, DatasetState, SchemaMetadata } from '../types';
import { assertNoDuplicateIds, checksumState, cloneDatasetState } from '../helpers';

const ENCODING = 'utf-8';
const JOURNAL_FILE = 'journal.log';
const RECORDS_FILE = 'records.json';
const TMP_SUFFIX = '.tmp';
const LOCK_SUFFIX = '.lock';
const SCHEMA_FILE = 'schema.json';
const BACKUP_DIR = 'backups';
const SCHEMA_LOCK_KEY = '__schema__';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface JsonFileDriverOptions {
  baseDir?: string;
  maxLockRetries?: number;
  lockRetryDelayMs?: number;
}

class LockHandle {
  constructor(private readonly handle: FileHandle, private readonly lockPath: string) {}

  async release(): Promise<void> {
    try {
      await this.handle.close();
    } finally {
      await fs.unlink(this.lockPath).catch(() => undefined);
    }
  }
}

export class JsonFileDriver implements StorageAdapter {
  private readonly baseDir: string;
  private readonly maxLockRetries: number;
  private readonly lockRetryDelayMs: number;

  constructor(options: JsonFileDriverOptions = {}) {
    const resolvedBaseDir = options.baseDir
      ? path.isAbsolute(options.baseDir)
        ? options.baseDir
        : path.resolve(process.cwd(), options.baseDir)
      : path.resolve(process.cwd(), '.data');
    this.baseDir = resolvedBaseDir;
    this.maxLockRetries = options.maxLockRetries ?? 50;
    this.lockRetryDelayMs = options.lockRetryDelayMs ?? 20;
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await this.ensureMetadata();
    for (const dataset of datasetList) {
      await this.ensureDataset(datasetDefinitions[dataset]);
    }
    await this.ensureDailyBackup();
  }

  async getMetadata(): Promise<SchemaMetadata> {
    await this.ensureMetadata();
    const buffer = await fs.readFile(this.schemaFilePath(), ENCODING);
    return JSON.parse(buffer) as SchemaMetadata;
  }

  async readDataset<TRecord>(dataset: DatasetDefinition<TRecord>): Promise<DatasetState<TRecord>> {
    await this.ensureDataset(dataset);
    const buffer = await fs.readFile(this.datasetFilePath(dataset.name), ENCODING);
    const parsed = JSON.parse(buffer) as DatasetState<TRecord>;
    return parsed;
  }

  async readAll(): Promise<Record<DatasetName, DatasetState<BaseRecord>>> {
    const entries: Partial<Record<DatasetName, DatasetState<BaseRecord>>> = {};
    for (const name of datasetList) {
      const definition = datasetDefinitions[name] as unknown as DatasetDefinition<BaseRecord>;
      entries[name] = await this.readDataset<BaseRecord>(definition);
    }
    return entries as Record<DatasetName, DatasetState<BaseRecord>>;
  }

  async transaction<TRecord extends BaseRecord>(
    dataset: DatasetDefinition<TRecord>,
    mutator: (current: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>,
    options: TransactionOptions = {},
  ): Promise<TransactionResult<TRecord>> {
    const lock = await this.acquireLock(dataset.name);
    try {
      const current = await this.readDataset(dataset);
      const before = cloneDatasetState(current);
      const mutated = await mutator(cloneDatasetState(current));
      if (!mutated || !Array.isArray((mutated as DatasetState<TRecord>).records)) {
        throw new Error(`Mutator for ${dataset.name} must return a dataset state with a records array`);
      }
      const schemaVersion =
        typeof (mutated as DatasetState<TRecord>).schemaVersion === 'number'
          ? (mutated as DatasetState<TRecord>).schemaVersion
          : dataset.schemaVersion;
      if (schemaVersion > dataset.schemaVersion) {
        throw new Error(`Mutator attempted to set schemaVersion ${schemaVersion} beyond allowed ${dataset.schemaVersion}`);
      }
      const lastUpdatedAt = mutated.lastUpdatedAt ?? new Date().toISOString();
      const nextState: DatasetState<TRecord> = {
        ...(mutated as DatasetState<TRecord>),
        schemaVersion,
        lastUpdatedAt,
      };
      assertNoDuplicateIds(dataset.name, nextState.records as Array<{ id?: string }>);
      const result = await this.writeDataset(dataset, before, nextState, options);
      return result;
    } finally {
      await lock.release();
    }
  }

  async createBackup(label?: string): Promise<string> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const now = new Date();
    const dateSegment = now.toISOString().slice(0, 10);
    const timeSegment = now.toISOString().slice(11, 19).replace(/:/g, '');
    const suffix = label ? `-${label}` : '';
    const targetDir = path.join(this.baseDir, BACKUP_DIR, dateSegment, `${timeSegment}${suffix}`);
    await fs.mkdir(targetDir, { recursive: true });

    const metadata = await this.getMetadata();
    await this.atomicWrite(path.join(targetDir, SCHEMA_FILE), metadata);

    for (const dataset of datasetList) {
      const sourceDir = this.datasetDir(dataset);
      const targetDatasetDir = path.join(targetDir, dataset);
      await fs.mkdir(targetDatasetDir, { recursive: true });
      await this.safeCopy(path.join(sourceDir, RECORDS_FILE), path.join(targetDatasetDir, RECORDS_FILE));
      await this.safeCopy(path.join(sourceDir, JOURNAL_FILE), path.join(targetDatasetDir, JOURNAL_FILE));
    }

    const metadataLock = await this.acquireLock(SCHEMA_LOCK_KEY, false);
    try {
      const nextMetadata = { ...metadata, lastBackupAt: now.toISOString() };
      await this.atomicWrite(this.schemaFilePath(), nextMetadata);
    } finally {
      await metadataLock.release();
    }

    return targetDir;
  }

  async ensureDailyBackup(): Promise<string | null> {
    const metadata = await this.getMetadata();
    const today = new Date().toISOString().slice(0, 10);
    if (metadata.lastBackupAt && metadata.lastBackupAt.slice(0, 10) === today) {
      return null;
    }
    return this.createBackup('daily');
  }

  async exportTo(targetFile: string): Promise<string> {
    await this.init();
    const metadata = await this.getMetadata();
    const datasets = await this.readAll();
    const payload = {
      exportedAt: new Date().toISOString(),
      metadata,
      datasets,
      version: metadata.version,
    };
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    await this.atomicWrite(targetFile, payload);
    return targetFile;
  }

  async importFrom(sourceFile: string, options: ImportOptions = {}): Promise<void> {
    const buffer = await fs.readFile(sourceFile, ENCODING);
    const parsed = JSON.parse(buffer) as {
      metadata: SchemaMetadata;
      datasets: Record<string, DatasetState<BaseRecord>>;
    };

    const backupPath = await this.createBackup('pre-import');
    try {
      await this.replaceMetadata(parsed.metadata);
      for (const datasetName of Object.keys(parsed.datasets)) {
        if (!datasetList.includes(datasetName as DatasetName)) {
          continue;
        }
        const definition = datasetDefinitions[datasetName as DatasetName] as unknown as DatasetDefinition<BaseRecord>;
        const state = parsed.datasets[datasetName] as DatasetState<BaseRecord>;
        await this.replaceDataset(definition, state, {
          actor: options.correlationId ?? 'import',
          description: 'dataset import',
        });
      }
    } catch (error) {
      await this.restoreBackup(backupPath);
      throw error;
    }
  }

  async validate(): Promise<ValidationReport> {
    const startedAt = new Date();
    const issues: ValidationIssue[] = [];
    const metadata = await this.getMetadata();

    for (const datasetName of datasetList) {
      const definition = datasetDefinitions[datasetName];
      const state = await this.readDataset(definition as DatasetDefinition<unknown>);
      try {
        assertNoDuplicateIds(datasetName, state.records as Array<{ id?: string }>);
      } catch (error) {
        issues.push({ dataset: datasetName, level: 'error', message: (error as Error).message });
      }
      if (state.schemaVersion !== definition.schemaVersion) {
        issues.push({
          dataset: datasetName,
          level: 'warning',
          message: `Dataset schema version ${state.schemaVersion} differs from expected ${definition.schemaVersion}`,
        });
      }
      const metadataEntry = metadata.datasets[datasetName];
      if (!metadataEntry) {
        issues.push({ dataset: datasetName, level: 'warning', message: 'Missing metadata entry' });
      }
    }

    await this.runReferentialValidation(issues);

    const completedAt = new Date();
    const hasErrors = issues.some((issue) => issue.level === 'error');
    return {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      issues,
      hasErrors,
    };
  }

  private async replaceDataset<TRecord extends BaseRecord>(
    dataset: DatasetDefinition<TRecord>,
    state: DatasetState<TRecord>,
    options: TransactionOptions,
  ): Promise<void> {
    await this.transaction(dataset as DatasetDefinition<TRecord>, async () => state, options);
  }

  private async replaceMetadata(metadata: SchemaMetadata): Promise<void> {
    const lock = await this.acquireLock(SCHEMA_LOCK_KEY);
    try {
      await this.atomicWrite(this.schemaFilePath(), metadata);
    } finally {
      await lock.release();
    }
  }

  private async runReferentialValidation(issues: ValidationIssue[]): Promise<void> {
    const datasets = await this.readAll();
    const users = new Set((datasets.users.records as Array<{ id: string }>).map((record) => record.id));
    const plans = new Set((datasets.learningPlans.records as Array<{ id: string }>).map((record) => record.id));

    for (const record of datasets.learningPlans.records as Array<{ userId: string; id: string }>) {
      if (!users.has(record.userId)) {
        issues.push({
          dataset: 'learningPlans',
          level: 'error',
          message: `Learning plan references missing user ${record.userId}`,
          recordIds: [record.id],
        });
      }
    }

    for (const record of datasets.progress.records as Array<{ userId: string; planId: string; id: string }>) {
      if (!users.has(record.userId) || !plans.has(record.planId)) {
        issues.push({
          dataset: 'progress',
          level: 'error',
          message: `Progress record references missing user or plan (${record.userId}, ${record.planId})`,
          recordIds: [record.id],
        });
      }
    }

    for (const record of datasets.gamification.records as Array<{ userId: string; planId: string; id: string }>) {
      if (!users.has(record.userId) || !plans.has(record.planId)) {
        issues.push({
          dataset: 'gamification',
          level: 'error',
          message: `Gamification record references missing user or plan (${record.userId}, ${record.planId})`,
          recordIds: [record.id],
        });
      }
    }

    for (const record of datasets.coaching.records as Array<{ userId: string; planId: string; id: string }>) {
      if (!users.has(record.userId) || !plans.has(record.planId)) {
        issues.push({
          dataset: 'coaching',
          level: 'error',
          message: `Coaching record references missing user or plan (${record.userId}, ${record.planId})`,
          recordIds: [record.id],
        });
      }
    }

    const tiers = new Set((datasets.subscriptionTiers.records as Array<{ id: string }>).map((record) => record.id));
    for (const record of datasets.subscriptions.records as Array<{ userId: string; tierId: string | null; id: string }>) {
      if (!users.has(record.userId)) {
        issues.push({
          dataset: 'subscriptions',
          level: 'error',
          message: `Subscription references missing user ${record.userId}`,
          recordIds: [record.id],
        });
      }
      if (record.tierId && !tiers.has(record.tierId)) {
        issues.push({
          dataset: 'subscriptions',
          level: 'error',
          message: `Subscription references missing tier ${record.tierId}`,
          recordIds: [record.id],
        });
      }
    }
  }

  private async writeDataset<TRecord extends BaseRecord>(
    dataset: DatasetDefinition<TRecord>,
    before: DatasetState<TRecord>,
    next: DatasetState<TRecord>,
    options: TransactionOptions,
  ): Promise<TransactionResult<TRecord>> {
    await this.ensureDataset(dataset);
    await this.atomicWrite(this.datasetFilePath(dataset.name), next);
    await this.updateMetadataEntry(dataset.name, next.lastUpdatedAt, next.schemaVersion);
    const journal = await this.appendJournal(dataset.name, before, next, options);
    return { state: next, journal };
  }

  private async ensureDataset<TRecord extends BaseRecord>(dataset: DatasetDefinition<TRecord>): Promise<void> {
    const dir = this.datasetDir(dataset.name);
    await fs.mkdir(dir, { recursive: true });
    const recordsPath = this.datasetFilePath(dataset.name);
    try {
      await fs.access(recordsPath);
    } catch {
      const initialState: DatasetState<TRecord> = {
        schemaVersion: dataset.schemaVersion,
        records: [...dataset.emptyState.records],
        lastUpdatedAt: new Date().toISOString(),
      };
      await this.atomicWrite(recordsPath, initialState);
    }
    const journalPath = this.journalFilePath(dataset.name);
    try {
      await fs.access(journalPath);
    } catch {
      await this.atomicWrite(journalPath, '', false);
    }
  }

  private async ensureMetadata(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const metadataPath = this.schemaFilePath();
    try {
      await fs.access(metadataPath);
    } catch {
      const now = new Date().toISOString();
      const datasetsMeta: SchemaMetadata['datasets'] = {} as SchemaMetadata['datasets'];
      for (const dataset of datasetList) {
        datasetsMeta[dataset] = {
          name: dataset,
          schemaVersion: datasetDefinitions[dataset].schemaVersion,
          lastMigratedAt: now,
        };
      }
      const metadata: SchemaMetadata = {
        version: 1,
        datasets: datasetsMeta,
      };
      await this.atomicWrite(metadataPath, metadata);
    }
  }

  private datasetDir(dataset: string): string {
    return path.join(this.baseDir, dataset);
  }

  private datasetFilePath(dataset: string): string {
    return path.join(this.datasetDir(dataset), RECORDS_FILE);
  }

  private journalFilePath(dataset: string): string {
    return path.join(this.datasetDir(dataset), JOURNAL_FILE);
  }

  private schemaFilePath(): string {
    return path.join(this.baseDir, SCHEMA_FILE);
  }

  private lockFilePath(key: string): string {
    return path.join(this.baseDir, `${key}${LOCK_SUFFIX}`);
  }

  private async acquireLock(key: string, retry = true): Promise<LockHandle> {
    const lockPath = key === SCHEMA_LOCK_KEY ? this.lockFilePath('schema') : path.join(this.datasetDir(key), LOCK_SUFFIX);
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    let attempt = 0;
    for (;;) {
      try {
        const handle = await fs.open(lockPath, 'wx');
        return new LockHandle(handle, lockPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST' && retry) {
          attempt += 1;
          if (attempt > this.maxLockRetries) {
            throw new Error(`Failed to acquire lock for ${key} after ${this.maxLockRetries} attempts`);
          }
          await sleep(this.lockRetryDelayMs);
          continue;
        }
        throw error;
      }
    }
  }

  private async atomicWrite(targetPath: string, data: unknown, stringify = true): Promise<void> {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const tempPath = `${targetPath}${TMP_SUFFIX}`;
    const handle = await fs.open(tempPath, 'w');
    try {
      const payload = stringify ? `${JSON.stringify(data, null, 2)}
` : (data as string);
      await handle.writeFile(payload, ENCODING);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(tempPath, targetPath);
  }

  private async safeCopy(source: string, target: string): Promise<void> {
    try {
      await fs.access(source);
    } catch {
      return;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(source, target);
  }

  private async updateMetadataEntry(dataset: DatasetName, lastUpdated: string, schemaVersion: number): Promise<void> {
    const lock = await this.acquireLock(SCHEMA_LOCK_KEY);
    try {
      const metadata = await this.getMetadata();
      metadata.datasets[dataset] = {
        name: dataset,
        schemaVersion,
        lastMigratedAt: lastUpdated,
      };
      await this.atomicWrite(this.schemaFilePath(), metadata);
    } finally {
      await lock.release();
    }
  }

  private async appendJournal(
    dataset: DatasetName,
    before: DatasetState<BaseRecord>,
    after: DatasetState<BaseRecord>,
    options: TransactionOptions,
  ): Promise<JournalEntrySummary> {
    const journalPath = this.journalFilePath(dataset);
    const baseEntry: Partial<JournalEntrySummary> & Pick<JournalEntrySummary, 'id' | 'dataset' | 'timestamp' | 'checksumBefore' | 'checksumAfter' | 'recordCountBefore' | 'recordCountAfter'> = {
      id: randomUUID(),
      dataset,
      timestamp: new Date().toISOString(),
      checksumBefore: checksumState(before),
      checksumAfter: checksumState(after),
      recordCountBefore: before.records.length,
      recordCountAfter: after.records.length,
    };
    if (options.description) {
      baseEntry.description = options.description;
    }
    if (options.correlationId) {
      baseEntry.correlationId = options.correlationId;
    }
    const entry = baseEntry as JournalEntrySummary;
    const line = `${JSON.stringify(entry)}
`;
    const handle = await fs.open(journalPath, 'a');
    try {
      await handle.writeFile(line, ENCODING);
      await handle.sync();
    } finally {
      await handle.close();
    }
    return entry;
  }

  private async restoreBackup(backupDir: string): Promise<void> {
    for (const dataset of datasetList) {
      const datasetDir = path.join(backupDir, dataset);
      const statePath = path.join(datasetDir, RECORDS_FILE);
      const journalPath = path.join(datasetDir, JOURNAL_FILE);
      await this.safeCopy(statePath, this.datasetFilePath(dataset));
      await this.safeCopy(journalPath, this.journalFilePath(dataset));
    }
    await this.safeCopy(path.join(backupDir, SCHEMA_FILE), this.schemaFilePath());
  }
}

export const jsonFileDriver = new JsonFileDriver();
