"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const subscriptionService_1 = require("../services/subscriptionService");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const changeSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    tierId: zod_1.z.string().min(1),
    paymentMethodId: zod_1.z.string().optional(),
    couponId: zod_1.z.string().optional(),
});
const paramsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
});
exports.subscriptionRouter = (0, express_1.Router)();
exports.subscriptionRouter.use(authMiddleware_1.requireAuth);
exports.subscriptionRouter.post("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = changeSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const payload = {
        userId: parsed.data.userId,
        tierId: parsed.data.tierId,
        paymentMethodId: parsed.data.paymentMethodId,
        couponId: parsed.data.couponId,
    };
    const result = await subscriptionService_1.subscriptionService.changeSubscription(payload);
    res.status(200).json({ status: "success", data: result });
}));
exports.subscriptionRouter.get("/:userId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId });
    if (!parsedParams.success) {
        throw new appError_1.AppError("Validation failed", 422, parsedParams.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const status = await subscriptionService_1.subscriptionService.getSubscriptionStatus(parsedParams.data.userId);
    res.json({ status: "success", data: status });
}));
//# sourceMappingURL=subscriptionRoutes.js.map