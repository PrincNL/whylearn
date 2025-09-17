import type { CoachingRecord, DatasetDefinition, DatasetName, GamificationRecord, LearningPlanRecord, ProgressRecord, SubscriptionEntitlementRecord, SubscriptionRecord, SubscriptionTierRecord, UserRecord } from './types';
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
export declare const datasetDefinitions: DefinitionMap;
export declare const datasetList: DatasetName[];
export {};
//# sourceMappingURL=datasets.d.ts.map