import path from 'path';

import { datasetDefinitions, datasetList } from '../../storage/datasets';
import { initStorage } from '../../storage';
import type { BaseRecord, DatasetDefinition, DatasetName } from '../../storage/types';
import type { MigrationStep } from '../../storage/migrations';
import { migrationPlan } from '../../storage/migrations';
import type { ValidationReport } from '../../storage/StorageAdapter';

export interface BackupOptions {
  label?: string;
}

export interface BackupResult {
  backupPath: string;
}

export interface ValidateResult {
  report: ValidationReport;
}

export interface ExportOptions {
  target?: string;
}

export interface ExportResult {
  file: string;
}

export interface ImportOptions {
  source: string;
  correlationId?: string;
}

export interface MigrationSummary {
  dataset: DatasetName;
  beforeVersion: number;
  afterVersion: number;
  stepsApplied: string[];
  changed: boolean;
}

export interface MigrateResult {
  backupPath: string;
  summaries: MigrationSummary[];
  validation: ValidationReport;
}

const buildDefaultExportPath = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(process.cwd(), '.data', 'exports', `whylearn-export-${stamp}.json`);
};

const collectDatasetSteps = (dataset: DatasetName): MigrationStep[] =>
  migrationPlan.filter((step) => step.dataset === dataset).sort((a, b) => a.from - b.from);

export const runBackup = async (options: BackupOptions = {}): Promise<BackupResult> => {
  const driver = await initStorage();
  const backupPath = await driver.createBackup(options.label);
  return { backupPath };
};

export const runValidate = async (): Promise<ValidateResult> => {
  const driver = await initStorage();
  const report = await driver.validate();
  if (report.hasErrors) {
    const messages = report.issues
      .filter((issue) => issue.level === 'error')
      .map((issue) => `${issue.dataset}: ${issue.message}`);
    const detail = [`Validation failed with ${messages.length} error(s):`, ...messages].join('\n');
    throw new Error(detail);
  }
  return { report };
};

export const runExport = async (options: ExportOptions = {}): Promise<ExportResult> => {
  const driver = await initStorage();
  const target = options.target ? path.resolve(options.target) : buildDefaultExportPath();
  const file = await driver.exportTo(target);
  return { file };
};

export const runImport = async (options: ImportOptions): Promise<ValidateResult> => {
  if (!options.source) {
    throw new Error('Import requires a source file path');
  }
  const driver = await initStorage();
  const importOptions = options.correlationId ? { correlationId: options.correlationId } : undefined;
  await driver.importFrom(path.resolve(options.source), importOptions);
  const report = await driver.validate();
  if (report.hasErrors) {
    throw new Error('Import completed but validation failed');
  }
  return { report };
};

export const runMigrate = async (): Promise<MigrateResult> => {
  const driver = await initStorage();
  const backup = await driver.createBackup('pre-migration');
  const summaries: MigrationSummary[] = [];

  for (const datasetName of datasetList) {
    const definition = datasetDefinitions[datasetName] as unknown as DatasetDefinition<BaseRecord>;
    const state = await driver.readDataset<BaseRecord>(definition);
    let currentVersion = state.schemaVersion ?? 0;
    const targetVersion = definition.schemaVersion;
    const steps = collectDatasetSteps(datasetName);
    const appliedSteps: string[] = [];
    let changed = false;

    for (const step of steps) {
      if (currentVersion !== step.from || step.to > targetVersion) {
        continue;
      }
      await driver.transaction<BaseRecord>(definition, (existing) => step.migrate(existing), {
        description: step.description,
        correlationId: `migrate-${datasetName}-${step.to}`,
        actor: 'migration-cli',
      });
      currentVersion = step.to;
      appliedSteps.push(step.description);
      changed = true;
    }

    if (currentVersion !== targetVersion) {
      const result = await driver.transaction<BaseRecord>(
        definition,
        (existing) => ({
          ...existing,
          schemaVersion: targetVersion,
        }),
        {
          description: 'schema version sync',
          correlationId: `schema-sync-${datasetName}`,
          actor: 'migration-cli',
        },
      );
      currentVersion = result.state.schemaVersion;
      changed = changed || !!appliedSteps.length || currentVersion !== state.schemaVersion;
    }

    summaries.push({
      dataset: datasetName,
      beforeVersion: state.schemaVersion ?? 0,
      afterVersion: currentVersion,
      stepsApplied: appliedSteps,
      changed,
    });
  }

  const validation = await driver.validate();
  if (validation.hasErrors) {
    throw new Error('Post-migration validation failed');
  }

  return { backupPath: backup, summaries, validation };
};

export const runDataCommand = async (argv: string[]): Promise<void> => {
  const [, , command, ...rest] = argv;
  switch (command) {
    case 'backup':
      await runBackup();
      return;
    case 'validate':
      await runValidate();
      return;
    case 'export': {
      const targetArg = rest[0];
      await runExport(targetArg ? { target: targetArg } : {});
      return;
    }
    case 'import': {
      const sourceArg = rest[0];
      if (!sourceArg) {
        throw new Error('Import requires a source file path');
      }
      await runImport({ source: sourceArg });
      return;
    }
    case 'migrate':
      await runMigrate();
      return;
    default:
      throw new Error(`Unknown data command: ${command}`);
  }
};
