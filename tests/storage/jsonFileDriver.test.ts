import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { JsonFileDriver } from '../../src/storage/json/JsonFileDriver';
import { datasetDefinitions } from '../../src/storage/datasets';
import { getStorageAdapter, setStorageAdapter, initStorage } from '../../src/storage';

const mkTmpDir = () => fs.mkdtempSync(path.join(process.cwd(), '.tmp-storage-'));

const buildUser = (id: string) => ({
  id,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  email: `${id}@example.com`,
  passwordHash: 'hash',
  premiumTierId: null,
  premiumStatus: 'free' as const,
});

describe('JsonFileDriver', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = mkTmpDir();
    const driver = new JsonFileDriver({ baseDir: tmpDir });
    setStorageAdapter(driver);
    await initStorage();
  });

  afterEach(async () => {
    setStorageAdapter(null);
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('initializes datasets and metadata', async () => {
    const driver = getStorageAdapter();
    const metadata = await driver.getMetadata();
    expect(metadata.datasets.users).toBeTruthy();
    const usersDir = path.join(tmpDir, 'users');
    expect(fs.existsSync(path.join(usersDir, 'records.json'))).toBe(true);
    expect(fs.existsSync(path.join(usersDir, 'journal.log'))).toBe(true);
  });

  it('persists records with journaling', async () => {
    const driver = getStorageAdapter();
    await driver.transaction(datasetDefinitions.users, (state) => {
      state.records.push({
        ...buildUser('user-1'),
      });
      return state;
    });

    const stored = await driver.readDataset(datasetDefinitions.users);
    expect(stored.records).toHaveLength(1);
    const journal = fs.readFileSync(path.join(tmpDir, 'users', 'journal.log'), 'utf-8').trim();
    expect(journal).not.toHaveLength(0);
  });

  it('avoids lost updates under concurrency', async () => {
    const driver = getStorageAdapter();
    const writes = Array.from({ length: 5 }, (_, index) =>
      driver.transaction(datasetDefinitions.users, (state) => {
        state.records.push({
          ...buildUser(`user-${index}`),
        });
        return state;
      }),
    );
    await Promise.all(writes);

    const stored = await driver.readDataset(datasetDefinitions.users);
    expect(stored.records).toHaveLength(5);
    const ids = new Set(stored.records.map((record) => record.id));
    expect(ids.size).toBe(5);
  });

  it('creates backups and exports data', async () => {
    const driver = getStorageAdapter();
    await driver.transaction(datasetDefinitions.users, (state) => {
      state.records.push({ ...buildUser('user-backup') });
      return state;
    });

    const backup = await driver.createBackup('test');
    expect(fs.existsSync(backup)).toBe(true);

    const exportFile = await driver.exportTo(path.join(tmpDir, 'export.json'));
    expect(fs.existsSync(exportFile)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
    expect(payload.datasets.users.records).toHaveLength(1);
  });
});
