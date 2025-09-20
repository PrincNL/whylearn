export type ProgressStatus = 'pending' | 'completed';

export interface ProgressMilestoneOverview {
  milestoneId: string;
  title: string;
  status: ProgressStatus;
  progressTimestamp: string | null;
  points: number;
  badgeCodes: string[];
}

export interface ProgressOverview {
  userId: string;
  planId: string;
  goal: string;
  totalMilestones: number;
  completedMilestones: number;
  milestones: ProgressMilestoneOverview[];
}

export interface GamificationStatus {
  userId: string;
  planId: string;
  totalPoints: number;
  progressPoints: number;
  bonusPoints: number;
  level: number;
  completionRate: number;
  completedMilestones: number;
  totalMilestones: number;
  badges: BadgeAward[];
}

export interface BadgeAward {
  code: string;
  name: string;
  description: string;
  awardedAt: string;
  bonusPoints?: number;
}

export interface CoachingSnapshot {
  id: string;
  userId: string;
  planId: string;
  summary: string;
  recommendedMilestones: string[];
  recommendedActions: string[];
  focusAreas: string[];
  motivationalMessage: string;
  planAdjustments: string[];
  createdAt: string;
}

export interface SubscriptionStatus {
  userId: string;
  tierId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  entitlements: string[];
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}

export interface CoachingStatus {
  progress: ProgressOverview;
  gamification: GamificationStatus;
  history: CoachingSnapshot[];
  latestAdvice?: CoachingSnapshot;
}
