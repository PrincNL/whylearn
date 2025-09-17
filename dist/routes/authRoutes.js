"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authMiddleware_1 = require("../middleware/authMiddleware");
const learningPlanService_1 = require("../services/learningPlanService");
const supabaseService_1 = require("../services/supabaseService");
const appError_1 = require("../utils/appError");
const asyncHandler_1 = require("../utils/asyncHandler");
const passwordPolicy = zod_1.z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[!@#$%^&*]/, "Password must include a special character");
const registrationSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: passwordPolicy,
    goal: zod_1.z.string().min(3, "Goal must be at least 3 characters long"),
    preferredPaceHoursPerWeek: zod_1.z.coerce.number().int().positive().max(40).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const resetRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string().uuid(),
    password: passwordPolicy,
});
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
const buildAuthResponse = async (userId) => {
    const user = await supabaseService_1.supabaseService.getUserById(userId);
    if (!user) {
        throw new appError_1.AppError("User not found", 404);
    }
    return supabaseService_1.supabaseService.sanitizeUser(user);
};
authRouter.post("/register", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    const { email, password, goal, preferredPaceHoursPerWeek } = parsed.data;
    const plan = (0, learningPlanService_1.generateLearningPlan)(goal, preferredPaceHoursPerWeek);
    const { userId, planId } = await supabaseService_1.supabaseService.registerUser(email, password, plan.goal, plan);
    const session = await supabaseService_1.supabaseService.createSession(userId);
    const user = await buildAuthResponse(userId);
    res.status(201).json({
        status: "success",
        data: {
            user,
            session,
            userId,
            planId,
            plan,
        },
    });
}));
authRouter.post("/login", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    const user = await supabaseService_1.supabaseService.verifyUserCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
        throw new appError_1.AppError("Invalid credentials", 401);
    }
    const session = await supabaseService_1.supabaseService.createSession(user.id);
    res.json({
        status: "success",
        data: {
            user: supabaseService_1.supabaseService.sanitizeUser(user),
            session,
        },
    });
}));
authRouter.post("/logout", authMiddleware_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.sessionToken) {
        await supabaseService_1.supabaseService.clearSession(req.sessionToken);
    }
    res.status(204).send();
}));
authRouter.post("/reset/request", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = resetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    const token = await supabaseService_1.supabaseService.createPasswordResetToken(parsed.data.email);
    res.json({
        status: "success",
        data: {
            resetToken: token ?? null,
        },
    });
}));
authRouter.post("/reset/confirm", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = resetConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new appError_1.AppError("Validation failed", 422, parsed.error.flatten());
    }
    const success = await supabaseService_1.supabaseService.resetPassword(parsed.data.token, parsed.data.password);
    if (!success) {
        throw new appError_1.AppError("Reset token invalid or expired", 400);
    }
    res.json({ status: "success" });
}));
//# sourceMappingURL=authRoutes.js.map