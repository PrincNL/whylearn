import type { StorageAdapter, TransactionOptions, TransactionResult, ValidationReport, ImportOptions } from '../StorageAdapter';
import type { BaseRecord, DatasetDefinition, DatasetName, DatasetState, SchemaMetadata } from '../types';
export interface JsonFileDriverOptions {
    baseDir?: string;
    maxLockRetries?: number;
    lockRetryDelayMs?: number;
}
export declare class JsonFileDriver implements StorageAdapter {
    private readonly baseDir;
    private readonly maxLockRetries;
    private readonly lockRetryDelayMs;
    constructor(options?: JsonFileDriverOptions);
    init(): Promise<void>;
    getMetadata(): Promise<SchemaMetadata>;
    readDataset<TRecord>(dataset: DatasetDefinition<TRecord>): Promise<DatasetState<TRecord>>;
    readAll(): Promise<Record<DatasetName, DatasetState<BaseRecord>>>;
    transaction<TRecord extends BaseRecord>(dataset: DatasetDefinition<TRecord>, mutator: (current: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>, options?: TransactionOptions): Promise<TransactionResult<TRecord>>;
    createBackup(label?: string): Promise<string>;
    ensureDailyBackup(): Promise<string | null>;
    exportTo(targetFile: string): Promise<string>;
    importFrom(sourceFile: string, options?: ImportOptions): Promise<void>;
    validate(): Promise<ValidationReport>;
    private replaceDataset;
    private replaceMetadata;
    private runReferentialValidation;
    private writeDataset;
    private ensureDataset;
    private ensureMetadata;
    private datasetDir;
    private datasetFilePath;
    private journalFilePath;
    private schemaFilePath;
    private lockFilePath;
    private acquireLock;
    private atomicWrite;
    private safeCopy;
    private updateMetadataEntry;
    private appendJournal;
    private restoreBackup;
}
export declare const jsonFileDriver: JsonFileDriver;
//# sourceMappingURL=JsonFileDriver.d.ts.map