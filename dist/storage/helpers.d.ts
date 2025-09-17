import type { BaseRecord, DatasetName, DatasetState } from './types';
export declare const createRecordId: (_prefix: string) => string;
export declare const cloneDatasetState: <T extends BaseRecord>(state: DatasetState<T>) => DatasetState<T>;
export declare const checksumState: <T extends BaseRecord>(state: DatasetState<T>) => string;
export declare const assertNoDuplicateIds: (dataset: DatasetName, records: Array<{
    id?: string;
}>) => void;
//# sourceMappingURL=helpers.d.ts.map