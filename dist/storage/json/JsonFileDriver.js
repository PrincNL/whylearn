"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonFileDriver = exports.JsonFileDriver = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const datasets_1 = require("../datasets");
const helpers_1 = require("../helpers");
const ENCODING = 'utf-8';
const JOURNAL_FILE = 'journal.log';
const RECORDS_FILE = 'records.json';
const TMP_SUFFIX = '.tmp';
const LOCK_SUFFIX = '.lock';
const SCHEMA_FILE = 'schema.json';
const BACKUP_DIR = 'backups';
const SCHEMA_LOCK_KEY = '__schema__';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class LockHandle {
    handle;
    lockPath;
    constructor(handle, lockPath) {
        this.handle = handle;
        this.lockPath = lockPath;
    }
    async release() {
        try {
            await this.handle.close();
        }
        finally {
            await fs_1.promises.unlink(this.lockPath).catch(() => undefined);
        }
    }
}
class JsonFileDriver {
    baseDir;
    maxLockRetries;
    lockRetryDelayMs;
    constructor(options = {}) {
        this.baseDir = options.baseDir ?? path_1.default.resolve(process.cwd(), '.data');
        this.maxLockRetries = options.maxLockRetries ?? 50;
        this.lockRetryDelayMs = options.lockRetryDelayMs ?? 20;
    }
    async init() {
        await fs_1.promises.mkdir(this.baseDir, { recursive: true });
        await this.ensureMetadata();
        for (const dataset of datasets_1.datasetList) {
            await this.ensureDataset(datasets_1.datasetDefinitions[dataset]);
        }
        await this.ensureDailyBackup();
    }
    async getMetadata() {
        await this.ensureMetadata();
        const buffer = await fs_1.promises.readFile(this.schemaFilePath(), ENCODING);
        return JSON.parse(buffer);
    }
    async readDataset(dataset) {
        await this.ensureDataset(dataset);
        const buffer = await fs_1.promises.readFile(this.datasetFilePath(dataset.name), ENCODING);
        const parsed = JSON.parse(buffer);
        return parsed;
    }
    async readAll() {
        const entries = {};
        for (const name of datasets_1.datasetList) {
            const definition = datasets_1.datasetDefinitions[name];
            entries[name] = await this.readDataset(definition);
        }
        return entries;
    }
    async transaction(dataset, mutator, options = {}) {
        const lock = await this.acquireLock(dataset.name);
        try {
            const current = await this.readDataset(dataset);
            const before = (0, helpers_1.cloneDatasetState)(current);
            const mutated = await mutator((0, helpers_1.cloneDatasetState)(current));
            if (!mutated || !Array.isArray(mutated.records)) {
                throw new Error(`Mutator for ${dataset.name} must return a dataset state with a records array`);
            }
            const schemaVersion = typeof mutated.schemaVersion === 'number'
                ? mutated.schemaVersion
                : dataset.schemaVersion;
            if (schemaVersion > dataset.schemaVersion) {
                throw new Error(`Mutator attempted to set schemaVersion ${schemaVersion} beyond allowed ${dataset.schemaVersion}`);
            }
            const lastUpdatedAt = mutated.lastUpdatedAt ?? new Date().toISOString();
            const nextState = {
                ...mutated,
                schemaVersion,
                lastUpdatedAt,
            };
            (0, helpers_1.assertNoDuplicateIds)(dataset.name, nextState.records);
            const result = await this.writeDataset(dataset, before, nextState, options);
            return result;
        }
        finally {
            await lock.release();
        }
    }
    async createBackup(label) {
        await fs_1.promises.mkdir(this.baseDir, { recursive: true });
        const now = new Date();
        const dateSegment = now.toISOString().slice(0, 10);
        const timeSegment = now.toISOString().slice(11, 19).replace(/:/g, '');
        const suffix = label ? `-${label}` : '';
        const targetDir = path_1.default.join(this.baseDir, BACKUP_DIR, dateSegment, `${timeSegment}${suffix}`);
        await fs_1.promises.mkdir(targetDir, { recursive: true });
        const metadata = await this.getMetadata();
        await this.atomicWrite(path_1.default.join(targetDir, SCHEMA_FILE), metadata);
        for (const dataset of datasets_1.datasetList) {
            const sourceDir = this.datasetDir(dataset);
            const targetDatasetDir = path_1.default.join(targetDir, dataset);
            await fs_1.promises.mkdir(targetDatasetDir, { recursive: true });
            await this.safeCopy(path_1.default.join(sourceDir, RECORDS_FILE), path_1.default.join(targetDatasetDir, RECORDS_FILE));
            await this.safeCopy(path_1.default.join(sourceDir, JOURNAL_FILE), path_1.default.join(targetDatasetDir, JOURNAL_FILE));
        }
        const metadataLock = await this.acquireLock(SCHEMA_LOCK_KEY, false);
        try {
            const nextMetadata = { ...metadata, lastBackupAt: now.toISOString() };
            await this.atomicWrite(this.schemaFilePath(), nextMetadata);
        }
        finally {
            await metadataLock.release();
        }
        return targetDir;
    }
    async ensureDailyBackup() {
        const metadata = await this.getMetadata();
        const today = new Date().toISOString().slice(0, 10);
        if (metadata.lastBackupAt && metadata.lastBackupAt.slice(0, 10) === today) {
            return null;
        }
        return this.createBackup('daily');
    }
    async exportTo(targetFile) {
        await this.init();
        const metadata = await this.getMetadata();
        const datasets = await this.readAll();
        const payload = {
            exportedAt: new Date().toISOString(),
            metadata,
            datasets,
            version: metadata.version,
        };
        await fs_1.promises.mkdir(path_1.default.dirname(targetFile), { recursive: true });
        await this.atomicWrite(targetFile, payload);
        return targetFile;
    }
    async importFrom(sourceFile, options = {}) {
        const buffer = await fs_1.promises.readFile(sourceFile, ENCODING);
        const parsed = JSON.parse(buffer);
        const backupPath = await this.createBackup('pre-import');
        try {
            await this.replaceMetadata(parsed.metadata);
            for (const datasetName of Object.keys(parsed.datasets)) {
                if (!datasets_1.datasetList.includes(datasetName)) {
                    continue;
                }
                const definition = datasets_1.datasetDefinitions[datasetName];
                const state = parsed.datasets[datasetName];
                await this.replaceDataset(definition, state, {
                    actor: options.correlationId ?? 'import',
                    description: 'dataset import',
                });
            }
        }
        catch (error) {
            await this.restoreBackup(backupPath);
            throw error;
        }
    }
    async validate() {
        const startedAt = new Date();
        const issues = [];
        const metadata = await this.getMetadata();
        for (const datasetName of datasets_1.datasetList) {
            const definition = datasets_1.datasetDefinitions[datasetName];
            const state = await this.readDataset(definition);
            try {
                (0, helpers_1.assertNoDuplicateIds)(datasetName, state.records);
            }
            catch (error) {
                issues.push({ dataset: datasetName, level: 'error', message: error.message });
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
    async replaceDataset(dataset, state, options) {
        await this.transaction(dataset, async () => state, options);
    }
    async replaceMetadata(metadata) {
        const lock = await this.acquireLock(SCHEMA_LOCK_KEY);
        try {
            await this.atomicWrite(this.schemaFilePath(), metadata);
        }
        finally {
            await lock.release();
        }
    }
    async runReferentialValidation(issues) {
        const datasets = await this.readAll();
        const users = new Set(datasets.users.records.map((record) => record.id));
        const plans = new Set(datasets.learningPlans.records.map((record) => record.id));
        for (const record of datasets.learningPlans.records) {
            if (!users.has(record.userId)) {
                issues.push({
                    dataset: 'learningPlans',
                    level: 'error',
                    message: `Learning plan references missing user ${record.userId}`,
                    recordIds: [record.id],
                });
            }
        }
        for (const record of datasets.progress.records) {
            if (!users.has(record.userId) || !plans.has(record.planId)) {
                issues.push({
                    dataset: 'progress',
                    level: 'error',
                    message: `Progress record references missing user or plan (${record.userId}, ${record.planId})`,
                    recordIds: [record.id],
                });
            }
        }
        for (const record of datasets.gamification.records) {
            if (!users.has(record.userId) || !plans.has(record.planId)) {
                issues.push({
                    dataset: 'gamification',
                    level: 'error',
                    message: `Gamification record references missing user or plan (${record.userId}, ${record.planId})`,
                    recordIds: [record.id],
                });
            }
        }
        for (const record of datasets.coaching.records) {
            if (!users.has(record.userId) || !plans.has(record.planId)) {
                issues.push({
                    dataset: 'coaching',
                    level: 'error',
                    message: `Coaching record references missing user or plan (${record.userId}, ${record.planId})`,
                    recordIds: [record.id],
                });
            }
        }
        const tiers = new Set(datasets.subscriptionTiers.records.map((record) => record.id));
        for (const record of datasets.subscriptions.records) {
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
    async writeDataset(dataset, before, next, options) {
        await this.ensureDataset(dataset);
        await this.atomicWrite(this.datasetFilePath(dataset.name), next);
        await this.updateMetadataEntry(dataset.name, next.lastUpdatedAt, next.schemaVersion);
        const journal = await this.appendJournal(dataset.name, before, next, options);
        return { state: next, journal };
    }
    async ensureDataset(dataset) {
        const dir = this.datasetDir(dataset.name);
        await fs_1.promises.mkdir(dir, { recursive: true });
        const recordsPath = this.datasetFilePath(dataset.name);
        try {
            await fs_1.promises.access(recordsPath);
        }
        catch {
            const initialState = {
                schemaVersion: dataset.schemaVersion,
                records: [...dataset.emptyState.records],
                lastUpdatedAt: new Date().toISOString(),
            };
            await this.atomicWrite(recordsPath, initialState);
        }
        const journalPath = this.journalFilePath(dataset.name);
        try {
            await fs_1.promises.access(journalPath);
        }
        catch {
            await this.atomicWrite(journalPath, '', false);
        }
    }
    async ensureMetadata() {
        await fs_1.promises.mkdir(this.baseDir, { recursive: true });
        const metadataPath = this.schemaFilePath();
        try {
            await fs_1.promises.access(metadataPath);
        }
        catch {
            const now = new Date().toISOString();
            const datasetsMeta = {};
            for (const dataset of datasets_1.datasetList) {
                datasetsMeta[dataset] = {
                    name: dataset,
                    schemaVersion: datasets_1.datasetDefinitions[dataset].schemaVersion,
                    lastMigratedAt: now,
                };
            }
            const metadata = {
                version: 1,
                datasets: datasetsMeta,
            };
            await this.atomicWrite(metadataPath, metadata);
        }
    }
    datasetDir(dataset) {
        return path_1.default.join(this.baseDir, dataset);
    }
    datasetFilePath(dataset) {
        return path_1.default.join(this.datasetDir(dataset), RECORDS_FILE);
    }
    journalFilePath(dataset) {
        return path_1.default.join(this.datasetDir(dataset), JOURNAL_FILE);
    }
    schemaFilePath() {
        return path_1.default.join(this.baseDir, SCHEMA_FILE);
    }
    lockFilePath(key) {
        return path_1.default.join(this.baseDir, `${key}${LOCK_SUFFIX}`);
    }
    async acquireLock(key, retry = true) {
        const lockPath = key === SCHEMA_LOCK_KEY ? this.lockFilePath('schema') : path_1.default.join(this.datasetDir(key), LOCK_SUFFIX);
        await fs_1.promises.mkdir(path_1.default.dirname(lockPath), { recursive: true });
        let attempt = 0;
        for (;;) {
            try {
                const handle = await fs_1.promises.open(lockPath, 'wx');
                return new LockHandle(handle, lockPath);
            }
            catch (error) {
                if (error.code === 'EEXIST' && retry) {
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
    async atomicWrite(targetPath, data, stringify = true) {
        await fs_1.promises.mkdir(path_1.default.dirname(targetPath), { recursive: true });
        const tempPath = `${targetPath}${TMP_SUFFIX}`;
        const handle = await fs_1.promises.open(tempPath, 'w');
        try {
            const payload = stringify ? `${JSON.stringify(data, null, 2)}
` : data;
            await handle.writeFile(payload, ENCODING);
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        await fs_1.promises.rename(tempPath, targetPath);
    }
    async safeCopy(source, target) {
        try {
            await fs_1.promises.access(source);
        }
        catch {
            return;
        }
        await fs_1.promises.mkdir(path_1.default.dirname(target), { recursive: true });
        await fs_1.promises.copyFile(source, target);
    }
    async updateMetadataEntry(dataset, lastUpdated, schemaVersion) {
        const lock = await this.acquireLock(SCHEMA_LOCK_KEY);
        try {
            const metadata = await this.getMetadata();
            metadata.datasets[dataset] = {
                name: dataset,
                schemaVersion,
                lastMigratedAt: lastUpdated,
            };
            await this.atomicWrite(this.schemaFilePath(), metadata);
        }
        finally {
            await lock.release();
        }
    }
    async appendJournal(dataset, before, after, options) {
        const journalPath = this.journalFilePath(dataset);
        const baseEntry = {
            id: (0, crypto_1.randomUUID)(),
            dataset,
            timestamp: new Date().toISOString(),
            checksumBefore: (0, helpers_1.checksumState)(before),
            checksumAfter: (0, helpers_1.checksumState)(after),
            recordCountBefore: before.records.length,
            recordCountAfter: after.records.length,
        };
        if (options.description) {
            baseEntry.description = options.description;
        }
        if (options.correlationId) {
            baseEntry.correlationId = options.correlationId;
        }
        const entry = baseEntry;
        const line = `${JSON.stringify(entry)}
`;
        const handle = await fs_1.promises.open(journalPath, 'a');
        try {
            await handle.writeFile(line, ENCODING);
            await handle.sync();
        }
        finally {
            await handle.close();
        }
        return entry;
    }
    async restoreBackup(backupDir) {
        for (const dataset of datasets_1.datasetList) {
            const datasetDir = path_1.default.join(backupDir, dataset);
            const statePath = path_1.default.join(datasetDir, RECORDS_FILE);
            const journalPath = path_1.default.join(datasetDir, JOURNAL_FILE);
            await this.safeCopy(statePath, this.datasetFilePath(dataset));
            await this.safeCopy(journalPath, this.journalFilePath(dataset));
        }
        await this.safeCopy(path_1.default.join(backupDir, SCHEMA_FILE), this.schemaFilePath());
    }
}
exports.JsonFileDriver = JsonFileDriver;
exports.jsonFileDriver = new JsonFileDriver();
//# sourceMappingURL=JsonFileDriver.js.map