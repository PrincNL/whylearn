import type { AuthenticatedUser, UserSubscriptionStatus } from "../services/dataService";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      sessionToken?: string;
      subscriptionStatus?: UserSubscriptionStatus;
    }
  }
}

export {};
