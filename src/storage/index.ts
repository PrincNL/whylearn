import { env } from '../config/env';
import { JsonFileDriver } from './json/JsonFileDriver';
import type { StorageAdapter } from './StorageAdapter';

let adapter: StorageAdapter | null = null;

export const getStorageAdapter = (): StorageAdapter => {
  if (!adapter) {
    adapter = new JsonFileDriver({ baseDir: env.DATA_DIR });
  }
  return adapter as StorageAdapter;
};

export const setStorageAdapter = (custom: StorageAdapter | null) => {
  adapter = custom;
};

export const initStorage = async () => {
  const driver = getStorageAdapter();
  await driver.init();
  return driver;
};

export * from './types';
export * from './StorageAdapter';

export { JsonFileDriver } from './json/JsonFileDriver';
export { SqliteDriver } from './sqlite/SqliteDriver';
