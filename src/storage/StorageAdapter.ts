import type { BaseRecord, DatasetDefinition, DatasetName, DatasetState, SchemaMetadata } from "./types";

export interface TransactionOptions {
  actor?: string;
  correlationId?: string;
  description?: string;
}

export interface JournalEntrySummary {
  id: string;
  dataset: DatasetName;
  timestamp: string;
  description?: string;
  correlationId?: string;
  checksumBefore: string;
  checksumAfter: string;
  recordCountBefore: number;
  recordCountAfter: number;
}

export interface TransactionResult<TRecord extends BaseRecord> {
  state: DatasetState<TRecord>;
  journal: JournalEntrySummary;
}

export interface ValidationIssue {
  dataset: DatasetName;
  level: "error" | "warning";
  message: string;
  recordIds?: string[];
}

export interface ValidationReport {
  startedAt: string;
  completedAt: string;
  issues: ValidationIssue[];
  hasErrors: boolean;
}

export interface ImportOptions {
  overwrite?: boolean;
  correlationId?: string;
}

export interface StorageAdapter {
  init(): Promise<void>;
  getMetadata(): Promise<SchemaMetadata>;
  readDataset<TRecord extends BaseRecord>(dataset: DatasetDefinition<TRecord>): Promise<DatasetState<TRecord>>;
  readAll(): Promise<Record<DatasetName, DatasetState<BaseRecord>>>;
  transaction<TRecord extends BaseRecord>(
    dataset: DatasetDefinition<TRecord>,
    mutator: (current: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TRecord>>;
  createBackup(label?: string): Promise<string>;
  ensureDailyBackup(): Promise<string | null>;
  exportTo(targetFile: string): Promise<string>;
  importFrom(sourceFile: string, options?: ImportOptions): Promise<void>;
  validate(): Promise<ValidationReport>;
}
