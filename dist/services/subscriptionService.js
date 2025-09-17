"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../config/env");
const appError_1 = require("../utils/appError");
const supabaseService_1 = require("./supabaseService");
class SubscriptionService {
    supabase;
    stripe;
    constructor(deps = {}) {
        this.supabase = deps.supabase ?? supabaseService_1.supabaseService;
        const stripeKey = deps.stripe ?? (env_1.env.STRIPE_SECRET_KEY ? new stripe_1.default(env_1.env.STRIPE_SECRET_KEY) : null);
        this.stripe = stripeKey;
    }
    async changeSubscription(request) {
        const tier = await this.supabase.getSubscriptionTier(request.tierId);
        if (!tier) {
            throw new appError_1.AppError('Subscription tier not found', 404, { tierId: request.tierId });
        }
        const existingStatus = await this.supabase.getUserSubscriptionStatus(request.userId);
        if (this.stripe && tier.stripePriceId) {
            const session = await this.createCheckoutSession(tier, request, existingStatus);
            const stripeCustomerId = typeof session.customer === 'string'
                ? session.customer
                : session.customer?.id ?? existingStatus.stripeCustomerId ?? null;
            const subscription = await this.supabase.upsertUserSubscription({
                userId: request.userId,
                tierId: tier.id,
                status: 'incomplete',
                currentPeriodEnd: null,
                stripeCustomerId,
                stripeSubscriptionId: existingStatus.stripeSubscriptionId ?? null,
            });
            return {
                status: subscription.status,
                subscription,
                checkoutSessionId: session.id,
                checkoutUrl: session.url ?? null,
            };
        }
        const subscription = await this.supabase.upsertUserSubscription({
            userId: request.userId,
            tierId: tier.id,
            status: 'active',
            currentPeriodEnd: null,
        });
        return {
            status: subscription.status,
            subscription,
        };
    }
    async getSubscriptionStatus(userId) {
        return this.supabase.getUserSubscriptionStatus(userId);
    }
    async assertEntitlement(userId, entitlementCode) {
        const status = await this.supabase.getUserSubscriptionStatus(userId);
        if (!status.entitlements.includes(entitlementCode) || !this.isStatusActive(status.status)) {
            throw new appError_1.AppError('Subscription required', 402, { entitlement: entitlementCode, status });
        }
    }
    isStatusActive(status) {
        return status === 'active' || status === 'trialing';
    }
    async createCheckoutSession(tier, request, existingStatus) {
        if (!this.stripe) {
            throw new appError_1.AppError('Stripe is not configured', 500);
        }
        if (!tier.stripePriceId) {
            throw new appError_1.AppError('Subscription tier is missing Stripe price configuration', 500, { tierId: tier.id });
        }
        const successUrl = env_1.env.STRIPE_SUCCESS_URL ?? 'https://example.com/success';
        const cancelUrl = env_1.env.STRIPE_CANCEL_URL ?? 'https://example.com/cancel';
        const params = {
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            line_items: [
                {
                    price: tier.stripePriceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: request.userId,
                tierId: tier.id,
            },
        };
        if (existingStatus.stripeCustomerId) {
            params.customer = existingStatus.stripeCustomerId;
        }
        if (request.couponId) {
            params.discounts = [{ coupon: request.couponId }];
        }
        const session = await this.stripe.checkout.sessions.create(params);
        return session;
    }
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
//# sourceMappingURL=subscriptionService.js.map