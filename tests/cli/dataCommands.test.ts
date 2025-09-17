import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { JsonFileDriver } from '../../src/storage/json/JsonFileDriver';
import { datasetDefinitions } from '../../src/storage/datasets';
import { initStorage, setStorageAdapter, getStorageAdapter } from '../../src/storage';
import { runBackup, runExport, runImport, runMigrate, runValidate } from '../../src/cli/data/commands';

const mkTmpDir = () => fs.mkdtempSync(path.join(process.cwd(), '.tmp-cli-'));

const buildUser = (id: string) => ({
  id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  email: `${id}@example.com`,
  passwordHash: 'hash',
  premiumTierId: null,
  premiumStatus: 'free' as const,
});

describe('data CLI commands', () => {
  let baseDir: string;

  beforeEach(async () => {
    baseDir = mkTmpDir();
    const driver = new JsonFileDriver({ baseDir });
    setStorageAdapter(driver);
    await initStorage();
  });

  afterEach(() => {
    setStorageAdapter(null);
    if (fs.existsSync(baseDir)) {
      fs.rmSync(baseDir, { recursive: true, force: true });
    }
  });

  it('runs backup and validation without errors', async () => {
    const backup = await runBackup({ label: 'spec' });
    expect(fs.existsSync(backup.backupPath)).toBe(true);

    const validation = await runValidate();
    expect(validation.report.hasErrors).toBe(false);
  });

  it('exports and imports data', async () => {
    const driver = getStorageAdapter();
    await driver.transaction(datasetDefinitions.users, (state) => {
      state.records.push({ ...buildUser('cli-user') });
      return state;
    });

    const target = path.join(baseDir, 'export.json');
    const { file } = await runExport({ target });
    expect(fs.existsSync(file)).toBe(true);

    const importDir = mkTmpDir();
    try {
      setStorageAdapter(new JsonFileDriver({ baseDir: importDir }));
      await runImport({ source: file, correlationId: 'test-import' });
      const imported = await getStorageAdapter().readDataset(datasetDefinitions.users);
      expect(imported.records).toHaveLength(1);
    } finally {
      setStorageAdapter(null);
      fs.rmSync(importDir, { recursive: true, force: true });
    }
  });

  it('reports migration summaries', async () => {
    const result = await runMigrate();
    expect(result.backupPath).toContain('pre-migration');
    expect(result.summaries.every((item) => item.afterVersion >= item.beforeVersion)).toBe(true);
    expect(result.validation.hasErrors).toBe(false);
  });
});
