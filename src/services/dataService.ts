import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

import { getStorageAdapter } from "../storage";
import { datasetDefinitions } from "../storage/datasets";
import type { StorageAdapter, TransactionOptions } from "../storage/StorageAdapter";
import { createRecordId } from "../storage/helpers";
import type {
  BadgeAward,
  CoachingRecord,
  GamificationRecord,
  LearningPlan,
  LearningPlanRecord,
  ProgressRecord,
  ProgressStatus,
  SubscriptionEntitlementRecord,
  SubscriptionRecord,
  SubscriptionStatusValue,
  SubscriptionTierRecord,
  UserRecord,
} from "../storage/types";

export interface RegistrationResult {
  userId: string;
  planId: string;
  user: UserRecord;
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

const BASE_POINTS_PER_MILESTONE = 100;
const POINTS_PER_LEVEL = 500;
const PASSWORD_SEPARATOR = ":";
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;

const BADGE_DEFINITIONS = [
  {
    code: "first_milestone",
    name: "First Milestone",
    description: "Completed the first milestone in a learning plan.",
    bonusPoints: 50,
    criteria: (ctx: ProgressOverview) => ctx.completedMilestones >= 1,
  },
  {
    code: "halfway_there",
    name: "Halfway There",
    description: "Reached at least half of the milestones.",
    bonusPoints: 75,
    criteria: (ctx: ProgressOverview) =>
      ctx.totalMilestones > 0 && ctx.completedMilestones >= Math.ceil(ctx.totalMilestones / 2),
  },
  {
    code: "plan_completed",
    name: "Plan Completed",
    description: "Completed every milestone in the learning plan.",
    bonusPoints: 125,
    criteria: (ctx: ProgressOverview) =>
      ctx.totalMilestones > 0 && ctx.completedMilestones === ctx.totalMilestones,
  },
] as const;

const buildEntitlement = (
  code: string,
  name: string,
  description: string,
): SubscriptionEntitlementRecord => {
  const now = new Date().toISOString();
  return {
    id: code,
    code,
    name,
    description,
    createdAt: now,
    updatedAt: now,
  };
};

const buildTier = (
  id: string,
  name: string,
  description: string,
  isDefault: boolean,
  entitlements: string[],
  stripePriceId: string | null,
): SubscriptionTierRecord => {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description,
    entitlements,
    isDefault,
    stripePriceId,
    createdAt: now,
    updatedAt: now,
  };
};

const DEFAULT_ENTITLEMENTS: SubscriptionEntitlementRecord[] = [
  buildEntitlement(
    "core_learning",
    "Core Learning",
    "Access to core learning plans and milestone tracking.",
  ),
  buildEntitlement(
    "gamification",
    "Gamification",
    "Earn points, streaks, and badges as you progress.",
  ),
  buildEntitlement(
    "ai_coaching",
    "AI Coaching",
    "Personalized coaching sessions with actionable feedback.",
  ),
  buildEntitlement(
    "premium_rewards",
    "Premium Rewards",
    "Unlock premium rewards, challenges, and bonus content.",
  ),
];

const DEFAULT_TIERS: SubscriptionTierRecord[] = [
  buildTier("tier-free", "Free Explorer", "Start learning with the essentials.", true, [
    "core_learning",
  ], null),
  buildTier(
    "tier-plus",
    "Growth Plus",
    "Advanced coaching, rewards, and streak multipliers.",
    false,
    ["core_learning", "gamification", "ai_coaching", "premium_rewards"],
    null,
  ),
];

const coerceTimestamp = (value?: string): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid progress timestamp");
  }
  return parsed.toISOString();
};

const computeLevel = (totalPoints: number): number =>
  Math.max(1, Math.floor(totalPoints / POINTS_PER_LEVEL) + 1);

const hashPassword = (password: string, saltHex?: string): string => {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : randomBytes(PASSWORD_SALT_BYTES);
  const derived = scryptSync(password, salt, PASSWORD_KEY_BYTES);
  return `${salt.toString("hex")}${PASSWORD_SEPARATOR}${derived.toString("hex")}`;
};

const verifyPassword = (password: string, hash: string): boolean => {
  const [saltHex, digestHex] = hash.split(PASSWORD_SEPARATOR);
  if (!saltHex || !digestHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(digestHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
};

export class DataService {
  private adapter: StorageAdapter | null;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter ?? null;
  }

  useAdapter(adapter: StorageAdapter | null): void {
    this.adapter = adapter;
  }

  private async getDriver(): Promise<StorageAdapter> {
    if (this.adapter) {
      return this.adapter;
    }
    const globalAdapter = getStorageAdapter();
    await globalAdapter.init();
    this.adapter = globalAdapter;
    return globalAdapter;
  }

  async registerUser(email: string, password: string, goal: string, plan: LearningPlan): Promise<RegistrationResult> {
    const driver = await this.getDriver();
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const userId = createRecordId("user");
    const planId = createRecordId("plan");
    const passwordHash = hashPassword(password);

    let userRecord: UserRecord | null = null;

    await driver.transaction(
      datasetDefinitions.users,
      (state) => {
        if (state.records.some((record) => record.email.toLowerCase() === normalizedEmail)) {
          throw new Error("Email is already registered");
        }
        const record: UserRecord = {
          id: userId,
          email: normalizedEmail,
          passwordHash,
          goal,
          onboardingStep: "learning_plan_generated",
          premiumTierId: null,
          premiumStatus: "free",
          sessionToken: null,
          sessionExpiresAt: null,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          createdAt: now,
          updatedAt: now,
        };
        state.records.push(record);
        userRecord = record;
        return state;
      },
      this.txOpts("register-user", userId),
    );

    await driver.transaction(
      datasetDefinitions.learningPlans,
      (state) => {
        state.records.push({
          id: planId,
          userId,
          goal,
          plan,
          createdAt: now,
          updatedAt: now,
        });
        return state;
      },
      this.txOpts("attach-plan", planId),
    );

    await this.ensureGamificationRecord(userId, planId, plan.milestones.length);

    if (!userRecord) {
      throw new Error("Registration failed");
    }

    return { userId, planId, user: userRecord };
  }

  async verifyUserCredentials(email: string, password: string): Promise<UserRecord | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }
    return verifyPassword(password, user.passwordHash) ? user : null;
  }

  async createSession(userId: string, lifetimeMinutes = 60 * 24): Promise<{ token: string; expiresAt: string }> {
    const driver = await this.getDriver();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000).toISOString();

    await driver.transaction(
      datasetDefinitions.users,
      (state) => {
        const index = state.records.findIndex((record) => record.id === userId);
        if (index < 0) {
          throw new Error("User not found");
        }
        const current = state.records[index]!;
        const updated: UserRecord = {
          ...current,
          sessionToken: token,
          sessionExpiresAt: expiresAt,
          updatedAt: new Date().toISOString(),
        };
        state.records[index] = updated;
        return state;
      },
      this.txOpts("session-issue", userId),
    );

    return { token, expiresAt };
  }

  async clearSession(token: string): Promise<void> {
    const driver = await this.getDriver();
    await driver.transaction(
      datasetDefinitions.users,
      (state) => {
        const index = state.records.findIndex((record) => record.sessionToken === token);
        if (index >= 0) {
          const current = state.records[index]!;
          const updated: UserRecord = {
            ...current,
            sessionToken: null,
            sessionExpiresAt: null,
            updatedAt: new Date().toISOString(),
          };
          state.records[index] = updated;
        }
        return state;
      },
      this.txOpts("session-clear", token),
    );
  }

  async createPasswordResetToken(
    email: string,
    lifetimeMinutes = 30,
  ): Promise<{ token: string; expiresAt: string } | null> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000).toISOString();
    const driver = await this.getDriver();

    await driver.transaction(
      datasetDefinitions.users,
      (state) => {
        const index = state.records.findIndex((record) => record.id === user.id);
        if (index >= 0) {
          const current = state.records[index]!;
          const updated: UserRecord = {
            ...current,
            passwordResetToken: token,
            passwordResetExpiresAt: expiresAt,
            updatedAt: new Date().toISOString(),
          };
          state.records[index] = updated;
        }
        return state;
      },
      this.txOpts("password-reset-issue", user.id),
    );

    return { token, expiresAt };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const driver = await this.getDriver();
    const users = await driver.readDataset(datasetDefinitions.users);
    const user = users.records.find(
      (record) => record.passwordResetToken === token && record.passwordResetExpiresAt,
    );

    if (!user) {
      return false;
    }

    if (
      user.passwordResetExpiresAt &&
      new Date(user.passwordResetExpiresAt).getTime() < Date.now()
    ) {
      return false;
    }

    const passwordHash = hashPassword(newPassword);

    await driver.transaction(
      datasetDefinitions.users,
      (state) => {
        const index = state.records.findIndex((record) => record.id === user.id);
        if (index >= 0) {
          const current = state.records[index]!;
          const updated: UserRecord = {
            ...current,
            passwordHash,
            passwordResetToken: null,
            passwordResetExpiresAt: null,
            updatedAt: new Date().toISOString(),
          };
          state.records[index] = updated;
        }
        return state;
      },
      this.txOpts("password-reset-complete", user.id),
    );

    return true;
  }

  async getUserById(userId: string): Promise<UserRecord | null> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.users);
    return state.records.find((record) => record.id === userId) ?? null;
  }

  async getUserBySessionToken(token: string): Promise<UserRecord | null> {
    if (!token) {
      return null;
    }
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.users);
    const record = state.records.find((user) => user.sessionToken === token);
    if (!record) {
      return null;
    }
    if (record.sessionExpiresAt && new Date(record.sessionExpiresAt).getTime() < Date.now()) {
      return null;
    }
    return record;
  }

  sanitizeUser(record: UserRecord): AuthenticatedUser {
    const auth: AuthenticatedUser = {
      id: record.id,
      email: record.email,
      premiumTierId: record.premiumTierId ?? null,
      premiumStatus: record.premiumStatus ?? "free",
    };
    if (record.goal) {
      auth.goal = record.goal;
    }
    if (record.onboardingStep) {
      auth.onboardingStep = record.onboardingStep;
    }
    return auth;
  }

  async upsertTaskProgress(input: {
    userId: string;
    milestoneId: string;
    status: ProgressStatus;
    planId?: string;
    progressTimestamp?: string;
  }): Promise<ProgressUpdateResult> {
    const plan = await this.fetchLatestPlanRecord(input.userId, input.planId);
    if (!plan) {
      throw new Error("No learning plan found for user");
    }

    const driver = await this.getDriver();
    const timestamp = input.status === "completed" ? coerceTimestamp(input.progressTimestamp) : null;

    const progressTx = await driver.transaction(
      datasetDefinitions.progress,
      (state) => {
        const index = state.records.findIndex(
          (record) =>
            record.userId === input.userId &&
            record.planId === plan.id &&
            record.milestoneId === input.milestoneId,
        );
        const now = new Date().toISOString();
        const existing = index >= 0 ? state.records[index]! : null;
        let points = existing?.points ?? 0;

        if (input.status === "completed") {
          points = points > 0 ? points : BASE_POINTS_PER_MILESTONE;
        }

        if (existing) {
          state.records[index] = {
            ...existing,
            status: input.status,
            progressTimestamp: timestamp,
            points,
            updatedAt: now,
          };
        } else {
          state.records.push({
            id: createRecordId("progress"),
            userId: input.userId,
            planId: plan.id,
            milestoneId: input.milestoneId,
            status: input.status,
            progressTimestamp: timestamp,
            points: input.status === "completed" ? BASE_POINTS_PER_MILESTONE : 0,
            badgeCodes: [],
            createdAt: now,
            updatedAt: now,
          });
        }
        return state;
      },
      this.txOpts("progress-upsert", `${input.userId}-${input.milestoneId}`),
    );

    const stored = progressTx.state.records.find(
      (record) =>
        record.userId === input.userId &&
        record.planId === plan.id &&
        record.milestoneId === input.milestoneId,
    );

    if (!stored) {
      throw new Error("Failed to persist progress update");
    }

    const overview = await this.getProgressOverview(input.userId, plan.id);
    const badgeOutcome = await this.evaluateBadges({ userId: input.userId, planId: plan.id, overview });

    if (badgeOutcome.milestoneBadgeCodes.length) {
      await driver.transaction(
        datasetDefinitions.progress,
        (state) => {
          const index = state.records.findIndex(
            (record) =>
              record.userId === input.userId &&
              record.planId === plan.id &&
              record.milestoneId === input.milestoneId,
          );
          if (index >= 0) {
            const record = state.records[index]!;
            const merged = Array.from(new Set([...record.badgeCodes, ...badgeOutcome.milestoneBadgeCodes]));
            state.records[index] = {
              ...record,
              badgeCodes: merged,
              updatedAt: new Date().toISOString(),
            };
          }
          return state;
        },
        this.txOpts("progress-badge-sync", `${input.userId}-${input.milestoneId}`),
      );
    }

    const gamification = await this.updateGamificationTotals({
      userId: input.userId,
      plan,
      overview,
      additionalBonus: badgeOutcome.additionalBonusPoints,
      badgeAwards: badgeOutcome.newBadges,
    });

    return {
      record: this.mapProgressRecord(stored),
      gamification,
      newBadges: badgeOutcome.newBadges,
    };
  }

  async getProgressOverview(userId: string, planId?: string): Promise<ProgressOverview> {
    const plan = await this.fetchLatestPlanRecord(userId, planId);
    if (!plan) {
      throw new Error("No learning plan found for user");
    }

    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.progress);
    const rows = state.records.filter((record) => record.userId === userId && record.planId === plan.id);
    const map = new Map<string, ProgressRecord>();
    for (const record of rows) {
      map.set(record.milestoneId, record);
    }

    const milestones = plan.plan.milestones.map((milestone) => {
      const record = map.get(milestone.id);
      return {
        milestoneId: milestone.id,
        title: milestone.title,
        status: record?.status ?? "pending",
        progressTimestamp: record?.progressTimestamp ?? null,
        points: record?.points ?? 0,
        badgeCodes: record?.badgeCodes ?? [],
      } satisfies ProgressMilestoneOverview;
    });

    const completedMilestones = milestones.filter((item) => item.status === "completed").length;

    return {
      userId,
      planId: plan.id,
      goal: plan.plan.goal,
      totalMilestones: milestones.length,
      completedMilestones,
      milestones,
    };
  }

  async getGamificationStatus(userId: string, planId?: string): Promise<GamificationStatus> {
    const plan = await this.fetchLatestPlanRecord(userId, planId);
    if (!plan) {
      throw new Error("No learning plan found for user");
    }
    const overview = await this.getProgressOverview(userId, plan.id);
    return this.updateGamificationTotals({
      userId,
      plan,
      overview,
      additionalBonus: 0,
      badgeAwards: [],
    });
  }

  async applyManualGamification(input: ManualGamificationInput): Promise<{
    gamification: GamificationStatus;
    newBadges: BadgeAward[];
  }> {
    const plan = await this.fetchLatestPlanRecord(input.userId, input.planId);
    if (!plan) {
      throw new Error("No learning plan found for user");
    }

    const overview = await this.getProgressOverview(input.userId, plan.id);
    let bonus = input.points ? Math.max(0, Math.trunc(input.points)) : 0;
    const newBadges: BadgeAward[] = [];

    if (input.badgeCode) {
      const definition = BADGE_DEFINITIONS.find((badge) => badge.code === input.badgeCode);
      if (!definition) {
        throw new Error(`Badge ${input.badgeCode} is not configured`);
      }
      const hasBadge = await this.hasBadge(input.userId, plan.id, definition.code);
      if (!hasBadge) {
        const awarded = this.toBadgeAward(definition, new Date().toISOString());
        newBadges.push(awarded);
        bonus += definition.bonusPoints ?? 0;
      }
    }

    const gamification = await this.updateGamificationTotals({
      userId: input.userId,
      plan,
      overview,
      additionalBonus: bonus,
      badgeAwards: newBadges,
    });

    return { gamification, newBadges };
  }

  async listSubscriptionTiers(): Promise<SubscriptionTier[]> {
    await this.ensureDefaultSubscriptionData();
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.subscriptionTiers);
    return state.records
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((record) => this.mapSubscriptionTier(record));
  }

  async getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null> {
    await this.ensureDefaultSubscriptionData();
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.subscriptionTiers);
    const record = state.records.find((row) => row.id === tierId);
    return record ? this.mapSubscriptionTier(record) : null;
  }

  async getUserSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.subscriptions);
    const record = state.records.find((row) => row.userId === userId);

    if (!record) {
      return {
        userId,
        tierId: null,
        status: "canceled",
        currentPeriodEnd: null,
        entitlements: [],
      };
    }

    const entitlements = record.tierId ? await this.listEntitlementsForTier(record.tierId) : [];
    return {
      userId,
      tierId: record.tierId,
      status: record.status,
      currentPeriodEnd: record.currentPeriodEnd,
      entitlements,
      stripeCustomerId: record.stripeCustomerId ?? null,
      stripeSubscriptionId: record.stripeSubscriptionId ?? null,
    };
  }

  async upsertUserSubscription(input: UpsertUserSubscriptionInput): Promise<UserSubscriptionStatus> {
    const driver = await this.getDriver();
    const now = new Date().toISOString();

    await driver.transaction(
      datasetDefinitions.subscriptions,
      (state) => {
        const index = state.records.findIndex((record) => record.userId === input.userId);
        const existing = index >= 0 ? state.records[index]! : null;
        const base: SubscriptionRecord = {
          id: existing ? existing.id : createRecordId("subscription"),
          userId: input.userId,
          tierId: input.tierId,
          status: input.status,
          currentPeriodEnd: input.currentPeriodEnd ?? null,
          stripeCustomerId: input.stripeCustomerId ?? null,
          stripeSubscriptionId: input.stripeSubscriptionId ?? null,
          createdAt: existing ? existing.createdAt : now,
          updatedAt: now,
        };
        if (existing) {
          state.records[index] = base;
        } else {
          state.records.push(base);
        }
        return state;
      },
      this.txOpts("subscription-upsert", input.userId),
    );

    return this.getUserSubscriptionStatus(input.userId);
  }

  async listEntitlements(): Promise<SubscriptionEntitlement[]> {
    await this.ensureDefaultSubscriptionData();
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.subscriptionEntitlements);
    return state.records
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((record) => ({
        code: record.code,
        name: record.name,
        description: record.description,
      }));
  }

  async listEntitlementsForTier(tierId: string): Promise<string[]> {
    await this.ensureDefaultSubscriptionData();
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.subscriptionTiers);
    const tier = state.records.find((record) => record.id === tierId);
    return tier ? [...tier.entitlements] : [];
  }

  async recordCoachingFeedback(input: CoachingFeedbackInput): Promise<CoachingFeedback> {
    const driver = await this.getDriver();
    const now = new Date().toISOString();
    const record: CoachingRecord = {
      id: createRecordId("coaching"),
      userId: input.userId,
      planId: input.planId,
      summary: input.summary,
      recommendedMilestones: [...input.recommendedMilestones],
      recommendedActions: [...input.recommendedActions],
      focusAreas: [...input.focusAreas],
      motivationalMessage: input.motivationalMessage,
      planAdjustments: [...input.planAdjustments],
      metadata: input.metadata ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await driver.transaction(
      datasetDefinitions.coaching,
      (state) => {
        state.records.unshift(record);
        return state;
      },
      this.txOpts("coaching-record", record.id),
    );

    return {
      id: record.id,
      userId: record.userId,
      planId: record.planId,
      summary: record.summary,
      recommendedMilestones: [...record.recommendedMilestones],
      recommendedActions: [...record.recommendedActions],
      focusAreas: [...record.focusAreas],
      motivationalMessage: record.motivationalMessage,
      planAdjustments: [...record.planAdjustments],
      metadata: record.metadata ?? null,
      createdAt: record.createdAt,
    };
  }

  async fetchCoachingFeedback(userId: string, planId?: string, limit = 5): Promise<CoachingFeedback[]> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.coaching);
    return state.records
      .filter((record) => record.userId === userId && (!planId || record.planId === planId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((record) => ({
        id: record.id,
        userId: record.userId,
        planId: record.planId,
        summary: record.summary,
        recommendedMilestones: [...record.recommendedMilestones],
        recommendedActions: [...record.recommendedActions],
        focusAreas: [...record.focusAreas],
        motivationalMessage: record.motivationalMessage,
        planAdjustments: [...record.planAdjustments],
        metadata: record.metadata ?? null,
        createdAt: record.createdAt,
      }));
  }

  async hasBadge(userId: string, planId: string, badgeCode: string): Promise<boolean> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.gamification);
    const record = state.records.find((item) => item.userId === userId && item.planId === planId);
    return record ? record.badges.some((badge) => badge.code === badgeCode) : false;
  }

  private async findUserByEmail(email: string): Promise<UserRecord | null> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.users);
    const normalized = email.trim().toLowerCase();
    return state.records.find((record) => record.email.toLowerCase() === normalized) ?? null;
  }

  private async fetchLatestPlanRecord(userId: string, planId?: string): Promise<LearningPlanRecord | null> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.learningPlans);
    if (planId) {
      return state.records.find((record) => record.id === planId && record.userId === userId) ?? null;
    }
    return state.records
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }

  private async ensureGamificationRecord(userId: string, planId: string, totalMilestones: number): Promise<void> {
    const driver = await this.getDriver();
    await driver.transaction(
      datasetDefinitions.gamification,
      (state) => {
        const exists = state.records.some((record) => record.userId === userId && record.planId === planId);
        if (!exists) {
          const now = new Date().toISOString();
          state.records.push({
            id: createRecordId("gamification"),
            userId,
            planId,
            progressPoints: 0,
            bonusPoints: 0,
            totalPoints: 0,
            level: 1,
            completionRate: 0,
            completedMilestones: 0,
            totalMilestones,
            badges: [],
            createdAt: now,
            updatedAt: now,
          });
        }
        return state;
      },
      this.txOpts("gamification-init", `${userId}-${planId}`),
    );
  }

  private async updateGamificationTotals(params: {
    userId: string;
    plan: LearningPlanRecord;
    overview: ProgressOverview;
    additionalBonus: number;
    badgeAwards: BadgeAward[];
  }): Promise<GamificationStatus> {
    await this.ensureGamificationRecord(params.userId, params.plan.id, params.plan.plan.milestones.length);
    const driver = await this.getDriver();
    const progressPoints = await this.computeProgressPoints(params.userId, params.plan.id);
    const state = await driver.readDataset(datasetDefinitions.gamification);
    const existing = state.records.find((record) => record.userId === params.userId && record.planId === params.plan.id);
    const now = new Date().toISOString();
    const bonusPoints = Math.max(0, (existing?.bonusPoints ?? 0) + Math.max(0, params.additionalBonus));
    const totalPoints = progressPoints + bonusPoints;

    const badgeMap = new Map<string, BadgeAward>();
    for (const badge of existing?.badges ?? []) {
      badgeMap.set(badge.code, badge);
    }
    for (const badge of params.badgeAwards) {
      badgeMap.set(badge.code, badge);
    }

    const record: GamificationRecord = existing
      ? {
          ...existing,
          progressPoints,
          bonusPoints,
          totalPoints,
          level: computeLevel(totalPoints),
          completionRate: params.overview.totalMilestones
            ? params.overview.completedMilestones / params.overview.totalMilestones
            : 0,
          completedMilestones: params.overview.completedMilestones,
          totalMilestones: params.overview.totalMilestones,
          badges: Array.from(badgeMap.values()).sort((a, b) => a.awardedAt.localeCompare(b.awardedAt)),
          updatedAt: now,
        }
      : {
          id: createRecordId("gamification"),
          userId: params.userId,
          planId: params.plan.id,
          progressPoints,
          bonusPoints,
          totalPoints,
          level: computeLevel(totalPoints),
          completionRate: params.overview.totalMilestones
            ? params.overview.completedMilestones / params.overview.totalMilestones
            : 0,
          completedMilestones: params.overview.completedMilestones,
          totalMilestones: params.overview.totalMilestones,
          badges: Array.from(badgeMap.values()),
          createdAt: now,
          updatedAt: now,
        };

    await driver.transaction(
      datasetDefinitions.gamification,
      (txState) => {
        const index = txState.records.findIndex(
          (item) => item.userId === params.userId && item.planId === params.plan.id,
        );
        if (index >= 0) {
          txState.records[index] = record;
        } else {
          txState.records.push(record);
        }
        return txState;
      },
      this.txOpts("gamification-update", `${params.userId}-${params.plan.id}`),
    );

    return {
      userId: record.userId,
      planId: record.planId,
      totalPoints: record.totalPoints,
      progressPoints: record.progressPoints,
      bonusPoints: record.bonusPoints,
      level: record.level,
      completionRate: record.completionRate,
      completedMilestones: record.completedMilestones,
      totalMilestones: record.totalMilestones,
      badges: [...record.badges],
    };
  }

  private async evaluateBadges(params: {
    userId: string;
    planId: string;
    overview: ProgressOverview;
  }): Promise<{ newBadges: BadgeAward[]; additionalBonusPoints: number; milestoneBadgeCodes: string[] }> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.gamification);
    const existing = state.records.find((record) => record.userId === params.userId && record.planId === params.planId);
    const awardedCodes = new Set(existing?.badges.map((badge) => badge.code) ?? []);
    const newBadges: BadgeAward[] = [];
    let additionalBonusPoints = 0;

    for (const definition of BADGE_DEFINITIONS) {
      if (awardedCodes.has(definition.code)) {
        continue;
      }
      if (!definition.criteria(params.overview)) {
        continue;
      }
      const award = this.toBadgeAward(definition, new Date().toISOString());
      newBadges.push(award);
      additionalBonusPoints += definition.bonusPoints ?? 0;
      awardedCodes.add(definition.code);
    }

    return {
      newBadges,
      additionalBonusPoints,
      milestoneBadgeCodes: newBadges.map((badge) => badge.code),
    };
  }

  private async computeProgressPoints(userId: string, planId: string): Promise<number> {
    const driver = await this.getDriver();
    const state = await driver.readDataset(datasetDefinitions.progress);
    return state.records
      .filter((record) => record.userId === userId && record.planId === planId)
      .reduce((total, record) => total + (Number.isFinite(record.points) ? record.points : 0), 0);
  }

  private mapProgressRecord(record: ProgressRecord): ProgressRow {
    return {
      id: record.id,
      user_id: record.userId,
      plan_id: record.planId,
      milestone_id: record.milestoneId,
      status: record.status,
      progress_timestamp: record.progressTimestamp,
      points: record.points,
      badge_codes: [...record.badgeCodes],
    };
  }

  private mapSubscriptionTier(record: SubscriptionTierRecord): SubscriptionTier {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      stripePriceId: record.stripePriceId ?? null,
      isDefault: record.isDefault,
    };
  }

  private toBadgeAward(
    definition: { code: string; name: string; description: string; bonusPoints?: number },
    awardedAt: string,
  ): BadgeAward {
    return {
      code: definition.code,
      name: definition.name,
      description: definition.description,
      awardedAt,
      bonusPoints: definition.bonusPoints ?? 0,
    };
  }

  private txOpts(description: string, correlationId: string): TransactionOptions {
    return {
      description,
      correlationId,
      actor: "storage-service",
    };
  }

  private async ensureDefaultSubscriptionData(): Promise<void> {
    const driver = await this.getDriver();

    await driver.transaction(
      datasetDefinitions.subscriptionEntitlements,
      (state) => {
        if (!state.records.length) {
          state.records.push(
            ...DEFAULT_ENTITLEMENTS.map((item) => ({
              ...item,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
          );
        }
        return state;
      },
      this.txOpts("seed-entitlements", "subscription-entitlements"),
    );

    await driver.transaction(
      datasetDefinitions.subscriptionTiers,
      (state) => {
        if (!state.records.length) {
          state.records.push(
            ...DEFAULT_TIERS.map((item) => ({
              ...item,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
          );
        }
        return state;
      },
      this.txOpts("seed-tiers", "subscription-tiers"),
    );
  }
}

export const dataService = new DataService();

export type { SubscriptionStatusValue } from '../storage/types';
