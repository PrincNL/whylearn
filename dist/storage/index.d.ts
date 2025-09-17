import type { StorageAdapter } from './StorageAdapter';
export declare const getStorageAdapter: () => StorageAdapter;
export declare const setStorageAdapter: (custom: StorageAdapter | null) => void;
export declare const initStorage: () => Promise<StorageAdapter>;
export * from './types';
export * from './StorageAdapter';
export { JsonFileDriver } from './json/JsonFileDriver';
export { SqliteDriver } from './sqlite/SqliteDriver';
//# sourceMappingURL=index.d.ts.map