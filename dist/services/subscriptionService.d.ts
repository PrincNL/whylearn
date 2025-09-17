import Stripe from 'stripe';
import { supabaseService, type SubscriptionStatusValue, type UserSubscriptionStatus } from './supabaseService';
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
export declare class SubscriptionService {
    private readonly supabase;
    private readonly stripe;
    constructor(deps?: SubscriptionDependencies);
    changeSubscription(request: SubscriptionChangeRequest): Promise<SubscriptionChangeResponse>;
    getSubscriptionStatus(userId: string): Promise<UserSubscriptionStatus>;
    assertEntitlement(userId: string, entitlementCode: string): Promise<void>;
    private isStatusActive;
    private createCheckoutSession;
}
export declare const subscriptionService: SubscriptionService;
export {};
//# sourceMappingURL=subscriptionService.d.ts.map