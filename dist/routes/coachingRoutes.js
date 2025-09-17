"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const coachingService_1 = require("../services/coachingService");
const subscriptionService_1 = require("../services/subscriptionService");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const generateSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().max(500).optional(),
});
const paramsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid().optional(),
});
exports.coachingRouter = (0, express_1.Router)();
exports.coachingRouter.use(authMiddleware_1.requireAuth);
const premiumGuard = (0, authMiddleware_1.requirePremium)("ai_coaching");
exports.coachingRouter.post("/", premiumGuard, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const payload = { userId: parsed.data.userId };
    if (parsed.data.planId) {
        payload.planId = parsed.data.planId;
    }
    if (parsed.data.notes) {
        payload.notes = parsed.data.notes;
    }
    await subscriptionService_1.subscriptionService.assertEntitlement(payload.userId, "ai_coaching");
    const session = await coachingService_1.coachingService.generateSession(payload);
    res.status(200).json({ status: "success", data: session });
}));
exports.coachingRouter.get("/:userId", premiumGuard, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId, planId: req.query.planId });
    if (!parsedParams.success) {
        throw new appError_1.AppError("Validation failed", 422, parsedParams.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    await subscriptionService_1.subscriptionService.assertEntitlement(parsedParams.data.userId, "ai_coaching");
    const status = await coachingService_1.coachingService.getCoachingStatus(parsedParams.data.userId, parsedParams.data.planId);
    res.json({ status: "success", data: status });
}));
//# sourceMappingURL=coachingRoutes.js.map