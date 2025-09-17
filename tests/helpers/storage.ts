import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { JsonFileDriver } from "../../src/storage/json/JsonFileDriver";
import { setStorageAdapter } from "../../src/storage";
import type { StorageAdapter } from "../../src/storage/StorageAdapter";
import { supabaseService } from "../../src/services/supabaseService";

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
  supabaseService.useAdapter(adapter);

  return {
    baseDir,
    adapter,
    cleanup: () => {
      supabaseService.useAdapter(null);
      setStorageAdapter(null);
      fs.rmSync(baseDir, { recursive: true, force: true });
    },
  };
};
