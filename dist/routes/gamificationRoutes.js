"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamificationRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const dataService_1 = require("../services/dataService");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const manualSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid().optional(),
    points: zod_1.z.coerce.number().int().min(0).optional(),
    badgeCode: zod_1.z.string().optional(),
});
exports.gamificationRouter = (0, express_1.Router)();
exports.gamificationRouter.use(authMiddleware_1.requireAuth);
exports.gamificationRouter.post("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = manualSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const result = await dataService_1.dataService.applyManualGamification(parsed.data);
    res.status(200).json({ status: "success", data: result });
}));
exports.gamificationRouter.get("/:userId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const paramsSchema = zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        planId: zod_1.z.string().uuid().optional(),
    });
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId, planId: req.query.planId });
    if (!parsedParams.success) {
        throw new appError_1.AppError("Validation failed", 422, parsedParams.error.flatten());
    }
    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
        throw new appError_1.AppError("Forbidden", 403);
    }
    const status = await dataService_1.dataService.getGamificationStatus(parsedParams.data.userId, parsedParams.data.planId);
    res.json({ status: "success", data: status });
}));
//# sourceMappingURL=gamificationRoutes.js.map