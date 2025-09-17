import type { StorageAdapter } from "../storage/StorageAdapter";
import type { BadgeAward, LearningPlan, ProgressStatus, SubscriptionStatusValue, UserRecord } from "../storage/types";
export interface RegistrationResult {
    userId: string;
    planId: string;
}
export interface ProgressMilestoneOverview {
    milestoneId: string;
    title: string;
    status: ProgressStatus;
    progressTimestamp: string | null;
    points: number;
    badgeCodes: string[];
}
export interface SubscriptionTier {
    id: string;
    name: string;
    description: string;
    stripePriceId: string | null;
    isDefault: boolean;
}
export interface SubscriptionEntitlement {
    code: string;
    name: string;
    description: string;
}
export interface AuthenticatedUser {
    id: string;
    email: string;
    goal?: string;
    onboardingStep?: string;
    premiumTierId: string | null;
    premiumStatus: SubscriptionStatusValue;
}
export interface UserSubscriptionStatus {
    userId: string;
    tierId: string | null;
    status: SubscriptionStatusValue;
    currentPeriodEnd: string | null;
    entitlements: string[];
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
}
export interface UpsertUserSubscriptionInput {
    userId: string;
    tierId: string;
    status: SubscriptionStatusValue;
    currentPeriodEnd?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
}
export interface ProgressOverview {
    userId: string;
    planId: string;
    goal: string;
    totalMilestones: number;
    completedMilestones: number;
    milestones: ProgressMilestoneOverview[];
}
export interface ProgressUpdateResult {
    record: ProgressRow;
    gamification: GamificationStatus;
    newBadges: BadgeAward[];
}
export interface CoachingFeedback {
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
    metadata?: Record<string, unknown> | null;
}
export interface CoachingFeedbackInput {
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
export interface ManualGamificationInput {
    userId: string;
    planId?: string | undefined;
    points?: number | undefined;
    badgeCode?: string | undefined;
}
export interface ProgressRow {
    id: string;
    user_id: string;
    plan_id: string;
    milestone_id: string;
    status: ProgressStatus;
    progress_timestamp: string | null;
    points: number;
    badge_codes: string[];
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
export declare class SupabaseService {
    private adapter;
    constructor(adapter?: StorageAdapter);
    useAdapter(adapter: StorageAdapter | null): void;
    private getDriver;
    registerUser(email: string, password: string, goal: string, plan: LearningPlan): Promise<RegistrationResult>;
    verifyUserCredentials(email: string, password: string): Promise<UserRecord | null>;
    createSession(userId: string, lifetimeMinutes?: number): Promise<{
        token: string;
        expiresAt: string;
    }>;
    clearSession(token: string): Promise<void>;
    createPasswordResetToken(email: string, lifetimeMinutes?: number): Promise<string | null>;
    resetPassword(token: string, newPassword: string): Promise<boolean>;
    getUserById(userId: string): Promise<UserRecord | null>;
    getUserBySessionToken(token: string): Promise<UserRecord | null>;
    sanitizeUser(record: UserRecord): AuthenticatedUser;
    upsertTaskProgress(input: {
        userId: string;
        milestoneId: string;
        status: ProgressStatus;
        planId?: string;
        progressTimestamp?: string;
    }): Promise<ProgressUpdateResult>;
    getProgressOverview(userId: string, planId?: string): Promise<ProgressOverview>;
    getGamificationStatus(userId: string, planId?: string): Promise<GamificationStatus>;
    applyManualGamification(input: ManualGamificationInput): Promise<{
        gamification: GamificationStatus;
        newBadges: BadgeAward[];
    }>;
    listSubscriptionTiers(): Promise<SubscriptionTier[]>;
    getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null>;
    getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus>;
    upsertUserSubscription(input: UpsertUserSubscriptionInput): Promise<UserSubscriptionStatus>;
    listEntitlements(): Promise<SubscriptionEntitlement[]>;
    listEntitlementsForTier(tierId: string): Promise<string[]>;
    recordCoachingFeedback(input: CoachingFeedbackInput): Promise<CoachingFeedback>;
    fetchCoachingFeedback(userId: string, planId?: string, limit?: number): Promise<CoachingFeedback[]>;
    hasBadge(userId: string, planId: string, badgeCode: string): Promise<boolean>;
    private findUserByEmail;
    private fetchLatestPlanRecord;
    private ensureGamificationRecord;
    private updateGamificationTotals;
    private evaluateBadges;
    private computeProgressPoints;
    private mapProgressRecord;
    private mapSubscriptionTier;
    private toBadgeAward;
    private txOpts;
    private ensureDefaultSubscriptionData;
}
export declare const supabaseService: SupabaseService;
export type { SubscriptionStatusValue } from '../storage/types';
//# sourceMappingURL=supabaseService.d.ts.map