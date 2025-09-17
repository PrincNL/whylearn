"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const supabaseService_1 = require("../services/supabaseService");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const statusSchema = zod_1.z.enum(["pending", "completed"]);
const upsertSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    milestoneId: zod_1.z.string().min(1),
    status: statusSchema.default("completed"),
    planId: zod_1.z.string().uuid().optional(),
    progressTimestamp: zod_1.z.string().datetime().optional(),
});
const paramsSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid().optional(),
});
exports.progressRouter = (0, express_1.Router)();
exports.progressRouter.use(authMiddleware_1.requireAuth);
exports.progressRouter.post("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const { planId, progressTimestamp, ...rest } = parsed.data;
    const payload = { ...rest };
    if (planId) {
        payload.planId = planId;
    }
    if (progressTimestamp) {
        payload.progressTimestamp = progressTimestamp;
    }
    const result = await supabaseService_1.supabaseService.upsertTaskProgress(payload);
    res.status(200).json({ status: "success", data: result });
}));
exports.progressRouter.get("/:userId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({
        userId: req.params.userId,
        planId: req.query.planId,
    });
    if (!parsedParams.success) {
        throw new appError_1.AppError("Validation failed", 422, parsedParams.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const overview = await supabaseService_1.supabaseService.getProgressOverview(parsedParams.data.userId, parsedParams.data.planId);
    res.json({ status: "success", data: overview });
}));
//# sourceMappingURL=progressRoutes.js.map