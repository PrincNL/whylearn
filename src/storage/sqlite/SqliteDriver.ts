import type {
  ImportOptions,
  StorageAdapter,
  TransactionOptions,
  TransactionResult,
  ValidationReport,
} from "../StorageAdapter";
import type { DatasetDefinition, DatasetName, DatasetState, SchemaMetadata } from "../types";

export class SqliteDriver implements StorageAdapter {
  constructor(private readonly options: Record<string, unknown> = {}) {
    void options;
  }

  async init(): Promise<void> {
    throw new Error("SqliteDriver is a placeholder and is not implemented yet.");
  }

  async getMetadata(): Promise<SchemaMetadata> {
    throw new Error("SqliteDriver is a placeholder and is not implemented yet.");
  }

  async readDataset<TRecord>(dataset: DatasetDefinition<TRecord>): Promise<DatasetState<TRecord>> {
    throw new Error(`SqliteDriver is a placeholder and cannot read dataset ${dataset.name}.`);
  }

  async readAll(): Promise<Record<DatasetName, DatasetState<unknown>>> {
    throw new Error("SqliteDriver is a placeholder and cannot read datasets.");
  }

  async transaction<TRecord>(
    dataset: DatasetDefinition<TRecord>,
    _mutator: (current: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>,
    _options?: TransactionOptions,
  ): Promise<TransactionResult<TRecord>> {
    throw new Error(`SqliteDriver is a placeholder and cannot mutate dataset ${dataset.name}.`);
  }

  async createBackup(_label?: string | undefined): Promise<string> {
    throw new Error("SqliteDriver does not support backups yet.");
  }

  async ensureDailyBackup(): Promise<string | null> {
    return null;
  }

  async exportTo(_targetFile: string): Promise<string> {
    throw new Error("SqliteDriver does not support export yet.");
  }

  async importFrom(_sourceFile: string, _options?: ImportOptions | undefined): Promise<void> {
    throw new Error("SqliteDriver does not support import yet.");
  }

  async validate(): Promise<ValidationReport> {
    throw new Error("SqliteDriver validation is not implemented yet.");
  }
}
