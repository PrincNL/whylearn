import type {
  BaseRecord,
  CoachingRecord,
  DatasetDefinition,
  DatasetName,
  DatasetState,
  GamificationRecord,
  LearningPlanRecord,
  ProgressRecord,
  SubscriptionEntitlementRecord,
  SubscriptionRecord,
  SubscriptionTierRecord,
  UserRecord,
} from './types';

const ISO_EPOCH = new Date(0).toISOString();

const empty = <T extends BaseRecord>(schemaVersion: number): DatasetState<T> => ({
  schemaVersion,
  records: [],
  lastUpdatedAt: ISO_EPOCH,
});

type DefinitionMap = {
  users: DatasetDefinition<UserRecord>;
  learningPlans: DatasetDefinition<LearningPlanRecord>;
  progress: DatasetDefinition<ProgressRecord>;
  gamification: DatasetDefinition<GamificationRecord>;
  coaching: DatasetDefinition<CoachingRecord>;
  subscriptions: DatasetDefinition<SubscriptionRecord>;
  subscriptionTiers: DatasetDefinition<SubscriptionTierRecord>;
  subscriptionEntitlements: DatasetDefinition<SubscriptionEntitlementRecord>;
};

export const datasetDefinitions: DefinitionMap = {
  users: {
    name: 'users',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<UserRecord>(1),
  },
  learningPlans: {
    name: 'learningPlans',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<LearningPlanRecord>(1),
  },
  progress: {
    name: 'progress',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<ProgressRecord>(1),
  },
  gamification: {
    name: 'gamification',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<GamificationRecord>(1),
  },
  coaching: {
    name: 'coaching',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<CoachingRecord>(1),
  },
  subscriptions: {
    name: 'subscriptions',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<SubscriptionRecord>(1),
  },
  subscriptionTiers: {
    name: 'subscriptionTiers',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<SubscriptionTierRecord>(1),
  },
  subscriptionEntitlements: {
    name: 'subscriptionEntitlements',
    schemaVersion: 1,
    primaryKey: (record) => record.id,
    emptyState: empty<SubscriptionEntitlementRecord>(1),
  },
};

export const datasetList: DatasetName[] = Object.keys(datasetDefinitions) as DatasetName[];
