import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/utils/appError';
import { SubscriptionService } from '../src/services/subscriptionService';
import type {
  SubscriptionTier,
  UserSubscriptionStatus,
  SubscriptionStatusValue,
} from '../src/services/dataService';

describe('SubscriptionService', () => {
  const activeStatus: UserSubscriptionStatus = {
    userId: 'user-123',
    tierId: 'premium',
    status: 'active',
    currentPeriodEnd: null,
    entitlements: ['ai_coaching'],
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };

  it('upgrades subscription without Stripe', async () => {
    const storeMock = {
      getSubscriptionTier: vi.fn().mockResolvedValue({
        id: 'premium',
        name: 'Premium',
        description: 'Premium tier',
        stripePriceId: null,
        isDefault: false,
      } satisfies SubscriptionTier),
      getUserSubscriptionStatus: vi.fn().mockResolvedValue({
        userId: 'user-123',
        tierId: null,
        status: 'canceled',
        currentPeriodEnd: null,
        entitlements: [],
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      } satisfies UserSubscriptionStatus),
      upsertUserSubscription: vi.fn().mockResolvedValue(activeStatus),
      listEntitlementsForTier: vi.fn(),
    } as any;

    const service = new SubscriptionService({ store: storeMock, stripe: null });

    const result = await service.changeSubscription({ userId: 'user-123', tierId: 'premium' });

    expect(result.status).toBe('active');
    expect(result.subscription.tierId).toBe('premium');
    expect(result.checkoutSessionId).toBeUndefined();
    expect(storeMock.upsertUserSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123', tierId: 'premium', status: 'active' })
    );
  });

  it('asserts entitlement for active subscription', async () => {
    const storeMock = {
      getUserSubscriptionStatus: vi.fn().mockResolvedValue(activeStatus),
    } as any;

    const service = new SubscriptionService({ store: storeMock, stripe: null });
    await expect(service.assertEntitlement('user-123', 'ai_coaching')).resolves.toBeUndefined();
  });

  it('throws when entitlement missing', async () => {
    const storeMock = {
      getUserSubscriptionStatus: vi.fn().mockResolvedValue({
        userId: 'user-123',
        tierId: 'basic',
        status: 'active' as SubscriptionStatusValue,
        currentPeriodEnd: null,
        entitlements: [],
      } satisfies UserSubscriptionStatus),
    } as any;

    const service = new SubscriptionService({ store: storeMock, stripe: null });

    await expect(service.assertEntitlement('user-123', 'ai_coaching')).rejects.toBeInstanceOf(AppError);
  });
});
