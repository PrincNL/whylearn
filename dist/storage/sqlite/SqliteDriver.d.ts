import type { ImportOptions, StorageAdapter, TransactionOptions, TransactionResult, ValidationReport } from "../StorageAdapter";
import type { DatasetDefinition, DatasetName, DatasetState, SchemaMetadata } from "../types";
export declare class SqliteDriver implements StorageAdapter {
    private readonly options;
    constructor(options?: Record<string, unknown>);
    init(): Promise<void>;
    getMetadata(): Promise<SchemaMetadata>;
    readDataset<TRecord>(dataset: DatasetDefinition<TRecord>): Promise<DatasetState<TRecord>>;
    readAll(): Promise<Record<DatasetName, DatasetState<unknown>>>;
    transaction<TRecord>(dataset: DatasetDefinition<TRecord>, _mutator: (current: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>, _options?: TransactionOptions): Promise<TransactionResult<TRecord>>;
    createBackup(_label?: string | undefined): Promise<string>;
    ensureDailyBackup(): Promise<string | null>;
    exportTo(_targetFile: string): Promise<string>;
    importFrom(_sourceFile: string, _options?: ImportOptions | undefined): Promise<void>;
    validate(): Promise<ValidationReport>;
}
//# sourceMappingURL=SqliteDriver.d.ts.map