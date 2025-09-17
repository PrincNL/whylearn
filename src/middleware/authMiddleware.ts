import type { RequestHandler } from "express";

import { supabaseService } from "../services/supabaseService";
import { subscriptionService } from "../services/subscriptionService";

const isSessionHeader = (token: string | undefined | null): token is string =>
  typeof token === "string" && token.length > 0;

const extractToken = (req: Parameters<RequestHandler>[0]): string | null => {
  const header = req.header("authorization") ?? req.header("Authorization");
  if (header && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }
  if (isSessionHeader(req.header("X-Session-Token"))) {
    return req.header("X-Session-Token")!.trim();
  }
  if (typeof req.query.sessionToken === "string") {
    return req.query.sessionToken;
  }
  return null;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    const user = await supabaseService.getUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Invalid or expired session" });
    }

    req.authUser = supabaseService.sanitizeUser(user);
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

const isActiveStatus = (status: string | undefined): boolean =>
  status === "active" || status === "trialing";

export const requirePremium = (entitlement?: string): RequestHandler =>
  async (req, res, next) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ status: "error", message: "Authentication required" });
      }

      const subscription = await subscriptionService.getSubscriptionStatus(req.authUser.id);
      req.subscriptionStatus = subscription;

      if (!isActiveStatus(subscription.status)) {
        return res.status(402).json({ status: "error", message: "Premium subscription required" });
      }

      if (entitlement && !subscription.entitlements.includes(entitlement)) {
        return res.status(403).json({ status: "error", message: "Entitlement missing" });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
