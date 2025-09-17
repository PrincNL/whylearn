import type { BaseRecord, DatasetName, DatasetState } from '../types';

export interface MigrationStep<TRecord extends BaseRecord = BaseRecord> {
  dataset: DatasetName;
  from: number;
  to: number;
  description: string;
  migrate: (state: DatasetState<TRecord>) => Promise<DatasetState<TRecord>> | DatasetState<TRecord>;
}

export const migrationPlan: MigrationStep[] = [];
