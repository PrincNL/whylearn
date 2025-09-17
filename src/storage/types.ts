export type DatasetName =
  | 'users'
  | 'learningPlans'
  | 'progress'
  | 'gamification'
  | 'coaching'
  | 'subscriptions'
  | 'subscriptionTiers'
  | 'subscriptionEntitlements';

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord extends BaseRecord {
  email: string;
  passwordHash: string;
  goal?: string;
  onboardingStep?: string;
  premiumTierId?: string | null;
  premiumStatus?: SubscriptionStatusValue;
  sessionToken?: string | null;
  sessionExpiresAt?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: string | null;
}

export interface LearningPlanRecord extends BaseRecord {
  userId: string;
  goal: string;
  plan: LearningPlan;
}

export interface ProgressRecord extends BaseRecord {
  userId: string;
  planId: string;
  milestoneId: string;
  status: ProgressStatus;
  progressTimestamp: string | null;
  points: number;
  badgeCodes: string[];
}

export interface GamificationRecord extends BaseRecord {
  userId: string;
  planId: string;
  progressPoints: number;
  bonusPoints: number;
  totalPoints: number;
  level: number;
  completionRate: number;
  completedMilestones: number;
  totalMilestones: number;
  badges: BadgeAward[];
}

export interface CoachingRecord extends BaseRecord {
  userId: string;
  planId: string;
  summary: string;
  recommendedMilestones: string[];
  recommendedActions: string[];
  focusAreas: string[];
  motivationalMessage: string;
  planAdjustments: string[];
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface SubscriptionRecord extends BaseRecord {
  userId: string;
  tierId: string | null;
  status: SubscriptionStatusValue;
  currentPeriodEnd: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface SubscriptionTierRecord extends BaseRecord {
  name: string;
  description: string;
  stripePriceId?: string | null;
  isDefault: boolean;
  entitlements: string[];
}

export interface SubscriptionEntitlementRecord extends BaseRecord {
  code: string;
  name: string;
  description: string;
}

export type ProgressStatus = 'pending' | 'completed';

export interface BadgeAward {
  code: string;
  name: string;
  description: string;
  awardedAt: string;
  bonusPoints?: number;
}

export interface LearningPlan {
  goal: string;
  summary: string;
  motivation: string;
  milestones: LearningPlanMilestone[];
  totalDurationHours: number;
  recommendedPaceHoursPerWeek: number;
  createdAt: string;
}

export interface LearningPlanMilestone {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  resources: string[];
}

export type SubscriptionStatusValue =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

export interface DatasetDefinition<TRecord = BaseRecord> {
  name: DatasetName;
  schemaVersion: number;
  primaryKey: (record: TRecord) => string;
  buildDefaultRecord?: () => TRecord;
  emptyState: DatasetState<TRecord>;
}

export interface DatasetState<TRecord = BaseRecord> {
  schemaVersion: number;
  records: TRecord[];
  lastUpdatedAt: string;
}

export interface SchemaMetadataEntry {
  name: DatasetName;
  schemaVersion: number;
  lastMigratedAt: string;
}

export interface SchemaMetadata {
  version: number;
  datasets: Record<DatasetName, SchemaMetadataEntry>;
  lastBackupAt?: string;
}
