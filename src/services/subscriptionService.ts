import Stripe from 'stripe';
import { env } from '../config/env';
import { AppError } from '../utils/appError';
import {
  supabaseService,
  type SubscriptionTier,
  type SubscriptionStatusValue,
  type UserSubscriptionStatus,
} from './supabaseService';

type SubscriptionDependencies = {
  supabase?: typeof supabaseService;
  stripe?: Stripe | null;
};

export interface SubscriptionChangeRequest {
  userId: string;
  tierId: string;
  paymentMethodId?: string | undefined;
  couponId?: string | undefined;
}

export interface SubscriptionChangeResponse {
  status: SubscriptionStatusValue;
  subscription: UserSubscriptionStatus;
  checkoutSessionId?: string;
  checkoutUrl?: string | null;
}

export class SubscriptionService {
  private readonly supabase: typeof supabaseService;
  private readonly stripe: Stripe | null;

  constructor(deps: SubscriptionDependencies = {}) {
    this.supabase = deps.supabase ?? supabaseService;
    const stripeKey = deps.stripe ?? (env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null);
    this.stripe = stripeKey as Stripe | null;
  }

  async changeSubscription(request: SubscriptionChangeRequest): Promise<SubscriptionChangeResponse> {
    const tier = await this.supabase.getSubscriptionTier(request.tierId);
    if (!tier) {
      throw new AppError('Subscription tier not found', 404, { tierId: request.tierId });
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

  async getSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus> {
    return this.supabase.getUserSubscriptionStatus(userId);
  }

  async assertEntitlement(userId: string, entitlementCode: string): Promise<void> {
    const status = await this.supabase.getUserSubscriptionStatus(userId);
    if (!status.entitlements.includes(entitlementCode) || !this.isStatusActive(status.status)) {
      throw new AppError('Subscription required', 402, { entitlement: entitlementCode, status });
    }
  }

  private isStatusActive(status: SubscriptionStatusValue): boolean {
    return status === 'active' || status === 'trialing';
  }

  private async createCheckoutSession(
    tier: SubscriptionTier,
    request: SubscriptionChangeRequest,
    existingStatus: UserSubscriptionStatus
  ) {
    if (!this.stripe) {
      throw new AppError('Stripe is not configured', 500);
    }

    if (!tier.stripePriceId) {
      throw new AppError('Subscription tier is missing Stripe price configuration', 500, { tierId: tier.id });
    }

    const successUrl = env.STRIPE_SUCCESS_URL ?? 'https://example.com/success';
    const cancelUrl = env.STRIPE_CANCEL_URL ?? 'https://example.com/cancel';

    const params: Stripe.Checkout.SessionCreateParams = {
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

export const subscriptionService = new SubscriptionService();
