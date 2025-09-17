"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseService = exports.SupabaseService = void 0;
const node_crypto_1 = require("node:crypto");
const storage_1 = require("../storage");
const datasets_1 = require("../storage/datasets");
const helpers_1 = require("../storage/helpers");
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
        criteria: (ctx) => ctx.completedMilestones >= 1,
    },
    {
        code: "halfway_there",
        name: "Halfway There",
        description: "Reached at least half of the milestones.",
        bonusPoints: 75,
        criteria: (ctx) => ctx.totalMilestones > 0 && ctx.completedMilestones >= Math.ceil(ctx.totalMilestones / 2),
    },
    {
        code: "plan_completed",
        name: "Plan Completed",
        description: "Completed every milestone in the learning plan.",
        bonusPoints: 125,
        criteria: (ctx) => ctx.totalMilestones > 0 && ctx.completedMilestones === ctx.totalMilestones,
    },
];
const buildEntitlement = (code, name, description) => {
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
const buildTier = (id, name, description, isDefault, entitlements, stripePriceId) => {
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
const DEFAULT_ENTITLEMENTS = [
    buildEntitlement("core_learning", "Core Learning", "Access to core learning plans and milestone tracking."),
    buildEntitlement("gamification", "Gamification", "Earn points, streaks, and badges as you progress."),
    buildEntitlement("ai_coaching", "AI Coaching", "Personalized coaching sessions with actionable feedback."),
    buildEntitlement("premium_rewards", "Premium Rewards", "Unlock premium rewards, challenges, and bonus content."),
];
const DEFAULT_TIERS = [
    buildTier("tier-free", "Free Explorer", "Start learning with the essentials.", true, [
        "core_learning",
    ], null),
    buildTier("tier-plus", "Growth Plus", "Advanced coaching, rewards, and streak multipliers.", false, ["core_learning", "gamification", "ai_coaching", "premium_rewards"], null),
];
const coerceTimestamp = (value) => {
    if (!value) {
        return new Date().toISOString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid progress timestamp");
    }
    return parsed.toISOString();
};
const computeLevel = (totalPoints) => Math.max(1, Math.floor(totalPoints / POINTS_PER_LEVEL) + 1);
const hashPassword = (password, saltHex) => {
    const salt = saltHex ? Buffer.from(saltHex, "hex") : (0, node_crypto_1.randomBytes)(PASSWORD_SALT_BYTES);
    const derived = (0, node_crypto_1.scryptSync)(password, salt, PASSWORD_KEY_BYTES);
    return `${salt.toString("hex")}${PASSWORD_SEPARATOR}${derived.toString("hex")}`;
};
const verifyPassword = (password, hash) => {
    const [saltHex, digestHex] = hash.split(PASSWORD_SEPARATOR);
    if (!saltHex || !digestHex) {
        return false;
    }
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(digestHex, "hex");
    const actual = (0, node_crypto_1.scryptSync)(password, salt, expected.length);
    return (0, node_crypto_1.timingSafeEqual)(actual, expected);
};
class SupabaseService {
    adapter;
    constructor(adapter) {
        this.adapter = adapter ?? null;
    }
    useAdapter(adapter) {
        this.adapter = adapter;
    }
    async getDriver() {
        if (this.adapter) {
            return this.adapter;
        }
        const globalAdapter = (0, storage_1.getStorageAdapter)();
        await globalAdapter.init();
        this.adapter = globalAdapter;
        return globalAdapter;
    }
    async registerUser(email, password, goal, plan) {
        const driver = await this.getDriver();
        const normalizedEmail = email.trim().toLowerCase();
        const now = new Date().toISOString();
        const userId = (0, helpers_1.createRecordId)("user");
        const planId = (0, helpers_1.createRecordId)("plan");
        const passwordHash = hashPassword(password);
        await driver.transaction(datasets_1.datasetDefinitions.users, (state) => {
            if (state.records.some((record) => record.email.toLowerCase() === normalizedEmail)) {
                throw new Error("Email is already registered");
            }
            state.records.push({
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
            });
            return state;
        }, this.txOpts("register-user", userId));
        await driver.transaction(datasets_1.datasetDefinitions.learningPlans, (state) => {
            state.records.push({
                id: planId,
                userId,
                goal,
                plan,
                createdAt: now,
                updatedAt: now,
            });
            return state;
        }, this.txOpts("attach-plan", planId));
        await this.ensureGamificationRecord(userId, planId, plan.milestones.length);
        return { userId, planId };
    }
    async verifyUserCredentials(email, password) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            return null;
        }
        return verifyPassword(password, user.passwordHash) ? user : null;
    }
    async createSession(userId, lifetimeMinutes = 60 * 24) {
        const driver = await this.getDriver();
        const token = (0, node_crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000).toISOString();
        await driver.transaction(datasets_1.datasetDefinitions.users, (state) => {
            const index = state.records.findIndex((record) => record.id === userId);
            if (index < 0) {
                throw new Error("User not found");
            }
            const current = state.records[index];
            const updated = {
                ...current,
                sessionToken: token,
                sessionExpiresAt: expiresAt,
                updatedAt: new Date().toISOString(),
            };
            state.records[index] = updated;
            return state;
        }, this.txOpts("session-issue", userId));
        return { token, expiresAt };
    }
    async clearSession(token) {
        const driver = await this.getDriver();
        await driver.transaction(datasets_1.datasetDefinitions.users, (state) => {
            const index = state.records.findIndex((record) => record.sessionToken === token);
            if (index >= 0) {
                const current = state.records[index];
                const updated = {
                    ...current,
                    sessionToken: null,
                    sessionExpiresAt: null,
                    updatedAt: new Date().toISOString(),
                };
                state.records[index] = updated;
            }
            return state;
        }, this.txOpts("session-clear", token));
    }
    async createPasswordResetToken(email, lifetimeMinutes = 30) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            return null;
        }
        const token = (0, node_crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + lifetimeMinutes * 60 * 1000).toISOString();
        const driver = await this.getDriver();
        await driver.transaction(datasets_1.datasetDefinitions.users, (state) => {
            const index = state.records.findIndex((record) => record.id === user.id);
            if (index >= 0) {
                const current = state.records[index];
                const updated = {
                    ...current,
                    passwordResetToken: token,
                    passwordResetExpiresAt: expiresAt,
                    updatedAt: new Date().toISOString(),
                };
                state.records[index] = updated;
            }
            return state;
        }, this.txOpts("password-reset-issue", user.id));
        return token;
    }
    async resetPassword(token, newPassword) {
        const driver = await this.getDriver();
        const users = await driver.readDataset(datasets_1.datasetDefinitions.users);
        const user = users.records.find((record) => record.passwordResetToken === token && record.passwordResetExpiresAt);
        if (!user) {
            return false;
        }
        if (user.passwordResetExpiresAt &&
            new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
            return false;
        }
        const passwordHash = hashPassword(newPassword);
        await driver.transaction(datasets_1.datasetDefinitions.users, (state) => {
            const index = state.records.findIndex((record) => record.id === user.id);
            if (index >= 0) {
                const current = state.records[index];
                const updated = {
                    ...current,
                    passwordHash,
                    passwordResetToken: null,
                    passwordResetExpiresAt: null,
                    updatedAt: new Date().toISOString(),
                };
                state.records[index] = updated;
            }
            return state;
        }, this.txOpts("password-reset-complete", user.id));
        return true;
    }
    async getUserById(userId) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.users);
        return state.records.find((record) => record.id === userId) ?? null;
    }
    async getUserBySessionToken(token) {
        if (!token) {
            return null;
        }
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.users);
        const record = state.records.find((user) => user.sessionToken === token);
        if (!record) {
            return null;
        }
        if (record.sessionExpiresAt && new Date(record.sessionExpiresAt).getTime() < Date.now()) {
            return null;
        }
        return record;
    }
    sanitizeUser(record) {
        const auth = {
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
    async upsertTaskProgress(input) {
        const plan = await this.fetchLatestPlanRecord(input.userId, input.planId);
        if (!plan) {
            throw new Error("No learning plan found for user");
        }
        const driver = await this.getDriver();
        const timestamp = input.status === "completed" ? coerceTimestamp(input.progressTimestamp) : null;
        const progressTx = await driver.transaction(datasets_1.datasetDefinitions.progress, (state) => {
            const index = state.records.findIndex((record) => record.userId === input.userId &&
                record.planId === plan.id &&
                record.milestoneId === input.milestoneId);
            const now = new Date().toISOString();
            const existing = index >= 0 ? state.records[index] : null;
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
            }
            else {
                state.records.push({
                    id: (0, helpers_1.createRecordId)("progress"),
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
        }, this.txOpts("progress-upsert", `${input.userId}-${input.milestoneId}`));
        const stored = progressTx.state.records.find((record) => record.userId === input.userId &&
            record.planId === plan.id &&
            record.milestoneId === input.milestoneId);
        if (!stored) {
            throw new Error("Failed to persist progress update");
        }
        const overview = await this.getProgressOverview(input.userId, plan.id);
        const badgeOutcome = await this.evaluateBadges({ userId: input.userId, planId: plan.id, overview });
        if (badgeOutcome.milestoneBadgeCodes.length) {
            await driver.transaction(datasets_1.datasetDefinitions.progress, (state) => {
                const index = state.records.findIndex((record) => record.userId === input.userId &&
                    record.planId === plan.id &&
                    record.milestoneId === input.milestoneId);
                if (index >= 0) {
                    const record = state.records[index];
                    const merged = Array.from(new Set([...record.badgeCodes, ...badgeOutcome.milestoneBadgeCodes]));
                    state.records[index] = {
                        ...record,
                        badgeCodes: merged,
                        updatedAt: new Date().toISOString(),
                    };
                }
                return state;
            }, this.txOpts("progress-badge-sync", `${input.userId}-${input.milestoneId}`));
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
    async getProgressOverview(userId, planId) {
        const plan = await this.fetchLatestPlanRecord(userId, planId);
        if (!plan) {
            throw new Error("No learning plan found for user");
        }
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.progress);
        const rows = state.records.filter((record) => record.userId === userId && record.planId === plan.id);
        const map = new Map();
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
            };
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
    async getGamificationStatus(userId, planId) {
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
    async applyManualGamification(input) {
        const plan = await this.fetchLatestPlanRecord(input.userId, input.planId);
        if (!plan) {
            throw new Error("No learning plan found for user");
        }
        const overview = await this.getProgressOverview(input.userId, plan.id);
        let bonus = input.points ? Math.max(0, Math.trunc(input.points)) : 0;
        const newBadges = [];
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
    async listSubscriptionTiers() {
        await this.ensureDefaultSubscriptionData();
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.subscriptionTiers);
        return state.records
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((record) => this.mapSubscriptionTier(record));
    }
    async getSubscriptionTier(tierId) {
        await this.ensureDefaultSubscriptionData();
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.subscriptionTiers);
        const record = state.records.find((row) => row.id === tierId);
        return record ? this.mapSubscriptionTier(record) : null;
    }
    async getUserSubscriptionStatus(userId) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.subscriptions);
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
    async upsertUserSubscription(input) {
        const driver = await this.getDriver();
        const now = new Date().toISOString();
        await driver.transaction(datasets_1.datasetDefinitions.subscriptions, (state) => {
            const index = state.records.findIndex((record) => record.userId === input.userId);
            const existing = index >= 0 ? state.records[index] : null;
            const base = {
                id: existing ? existing.id : (0, helpers_1.createRecordId)("subscription"),
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
            }
            else {
                state.records.push(base);
            }
            return state;
        }, this.txOpts("subscription-upsert", input.userId));
        return this.getUserSubscriptionStatus(input.userId);
    }
    async listEntitlements() {
        await this.ensureDefaultSubscriptionData();
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.subscriptionEntitlements);
        return state.records
            .slice()
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((record) => ({
            code: record.code,
            name: record.name,
            description: record.description,
        }));
    }
    async listEntitlementsForTier(tierId) {
        await this.ensureDefaultSubscriptionData();
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.subscriptionTiers);
        const tier = state.records.find((record) => record.id === tierId);
        return tier ? [...tier.entitlements] : [];
    }
    async recordCoachingFeedback(input) {
        const driver = await this.getDriver();
        const now = new Date().toISOString();
        const record = {
            id: (0, helpers_1.createRecordId)("coaching"),
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
        await driver.transaction(datasets_1.datasetDefinitions.coaching, (state) => {
            state.records.unshift(record);
            return state;
        }, this.txOpts("coaching-record", record.id));
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
    async fetchCoachingFeedback(userId, planId, limit = 5) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.coaching);
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
    async hasBadge(userId, planId, badgeCode) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.gamification);
        const record = state.records.find((item) => item.userId === userId && item.planId === planId);
        return record ? record.badges.some((badge) => badge.code === badgeCode) : false;
    }
    async findUserByEmail(email) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.users);
        const normalized = email.trim().toLowerCase();
        return state.records.find((record) => record.email.toLowerCase() === normalized) ?? null;
    }
    async fetchLatestPlanRecord(userId, planId) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.learningPlans);
        if (planId) {
            return state.records.find((record) => record.id === planId && record.userId === userId) ?? null;
        }
        return state.records
            .filter((record) => record.userId === userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    }
    async ensureGamificationRecord(userId, planId, totalMilestones) {
        const driver = await this.getDriver();
        await driver.transaction(datasets_1.datasetDefinitions.gamification, (state) => {
            const exists = state.records.some((record) => record.userId === userId && record.planId === planId);
            if (!exists) {
                const now = new Date().toISOString();
                state.records.push({
                    id: (0, helpers_1.createRecordId)("gamification"),
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
        }, this.txOpts("gamification-init", `${userId}-${planId}`));
    }
    async updateGamificationTotals(params) {
        await this.ensureGamificationRecord(params.userId, params.plan.id, params.plan.plan.milestones.length);
        const driver = await this.getDriver();
        const progressPoints = await this.computeProgressPoints(params.userId, params.plan.id);
        const state = await driver.readDataset(datasets_1.datasetDefinitions.gamification);
        const existing = state.records.find((record) => record.userId === params.userId && record.planId === params.plan.id);
        const now = new Date().toISOString();
        const bonusPoints = Math.max(0, (existing?.bonusPoints ?? 0) + Math.max(0, params.additionalBonus));
        const totalPoints = progressPoints + bonusPoints;
        const badgeMap = new Map();
        for (const badge of existing?.badges ?? []) {
            badgeMap.set(badge.code, badge);
        }
        for (const badge of params.badgeAwards) {
            badgeMap.set(badge.code, badge);
        }
        const record = existing
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
                id: (0, helpers_1.createRecordId)("gamification"),
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
        await driver.transaction(datasets_1.datasetDefinitions.gamification, (txState) => {
            const index = txState.records.findIndex((item) => item.userId === params.userId && item.planId === params.plan.id);
            if (index >= 0) {
                txState.records[index] = record;
            }
            else {
                txState.records.push(record);
            }
            return txState;
        }, this.txOpts("gamification-update", `${params.userId}-${params.plan.id}`));
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
    async evaluateBadges(params) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.gamification);
        const existing = state.records.find((record) => record.userId === params.userId && record.planId === params.planId);
        const awardedCodes = new Set(existing?.badges.map((badge) => badge.code) ?? []);
        const newBadges = [];
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
    async computeProgressPoints(userId, planId) {
        const driver = await this.getDriver();
        const state = await driver.readDataset(datasets_1.datasetDefinitions.progress);
        return state.records
            .filter((record) => record.userId === userId && record.planId === planId)
            .reduce((total, record) => total + (Number.isFinite(record.points) ? record.points : 0), 0);
    }
    mapProgressRecord(record) {
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
    mapSubscriptionTier(record) {
        return {
            id: record.id,
            name: record.name,
            description: record.description,
            stripePriceId: record.stripePriceId ?? null,
            isDefault: record.isDefault,
        };
    }
    toBadgeAward(definition, awardedAt) {
        return {
            code: definition.code,
            name: definition.name,
            description: definition.description,
            awardedAt,
            bonusPoints: definition.bonusPoints ?? 0,
        };
    }
    txOpts(description, correlationId) {
        return {
            description,
            correlationId,
            actor: "storage-service",
        };
    }
    async ensureDefaultSubscriptionData() {
        const driver = await this.getDriver();
        await driver.transaction(datasets_1.datasetDefinitions.subscriptionEntitlements, (state) => {
            if (!state.records.length) {
                state.records.push(...DEFAULT_ENTITLEMENTS.map((item) => ({
                    ...item,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })));
            }
            return state;
        }, this.txOpts("seed-entitlements", "subscription-entitlements"));
        await driver.transaction(datasets_1.datasetDefinitions.subscriptionTiers, (state) => {
            if (!state.records.length) {
                state.records.push(...DEFAULT_TIERS.map((item) => ({
                    ...item,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                })));
            }
            return state;
        }, this.txOpts("seed-tiers", "subscription-tiers"));
    }
}
exports.SupabaseService = SupabaseService;
exports.supabaseService = new SupabaseService();
//# sourceMappingURL=supabaseService.js.map