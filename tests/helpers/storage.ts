import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { JsonFileDriver } from "../../src/storage/json/JsonFileDriver";
import { setStorageAdapter } from "../../src/storage";
import type { StorageAdapter } from "../../src/storage/StorageAdapter";
import { dataService } from "../../src/services/dataService";

export interface TestStorageContext {
  baseDir: string;
  adapter: StorageAdapter;
  cleanup: () => void;
}

export const setupTestStorage = async (): Promise<TestStorageContext> => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "whylearn-test-"));
  const adapter = new JsonFileDriver({ baseDir });
  await adapter.init();
  setStorageAdapter(adapter);
  dataService.useAdapter(adapter);

  return {
    baseDir,
    adapter,
    cleanup: () => {
      dataService.useAdapter(null);
      setStorageAdapter(null);
      fs.rmSync(baseDir, { recursive: true, force: true });
    },
  };
};
