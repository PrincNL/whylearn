"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePremium = exports.requireAuth = void 0;
const dataService_1 = require("../services/dataService");
const subscriptionService_1 = require("../services/subscriptionService");
const isSessionHeader = (token) => typeof token === "string" && token.length > 0;
const extractToken = (req) => {
    const header = req.header("authorization") ?? req.header("Authorization");
    if (header && header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length).trim();
    }
    if (isSessionHeader(req.header("X-Session-Token"))) {
        return req.header("X-Session-Token").trim();
    }
    if (typeof req.query.sessionToken === "string") {
        return req.query.sessionToken;
    }
    return null;
};
const requireAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ status: "error", message: "Authentication required" });
        }
        const user = await dataService_1.dataService.getUserBySessionToken(token);
        if (!user) {
            return res.status(401).json({ status: "error", message: "Invalid or expired session" });
        }
        req.authUser = dataService_1.dataService.sanitizeUser(user);
        req.sessionToken = token;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
const isActiveStatus = (status) => status === "active" || status === "trialing";
const requirePremium = (entitlement) => async (req, res, next) => {
    try {
        if (!req.authUser) {
            return res.status(401).json({ status: "error", message: "Authentication required" });
        }
        const subscription = await subscriptionService_1.subscriptionService.getSubscriptionStatus(req.authUser.id);
        req.subscriptionStatus = subscription;
        if (!isActiveStatus(subscription.status)) {
            return res.status(402).json({ status: "error", message: "Premium subscription required" });
        }
        if (entitlement && !subscription.entitlements.includes(entitlement)) {
            return res.status(403).json({ status: "error", message: "Entitlement missing" });
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requirePremium = requirePremium;
//# sourceMappingURL=authMiddleware.js.map