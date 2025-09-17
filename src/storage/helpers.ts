import { createHash, randomUUID } from 'crypto';

import type { BaseRecord, DatasetName, DatasetState } from './types';

export const createRecordId = (_prefix: string): string => randomUUID();

export const cloneDatasetState = <T extends BaseRecord>(state: DatasetState<T>): DatasetState<T> =>
  JSON.parse(JSON.stringify(state));

export const checksumState = <T extends BaseRecord>(state: DatasetState<T>): string =>
  createHash('sha256').update(JSON.stringify(state.records)).digest('hex');

export const assertNoDuplicateIds = (dataset: DatasetName, records: Array<{ id?: string }>): void => {
  const seen = new Set<string>();
  for (const record of records) {
    const id = record?.id;
    if (!id) {
      throw new Error(`Dataset ${dataset} contains a record without an id`);
    }
    if (seen.has(id)) {
      throw new Error(`Dataset ${dataset} contains duplicate id ${id}`);
    }
    seen.add(id);
  }
};
