import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/authMiddleware";
import { generateLearningPlan } from "../services/learningPlanService";
import { supabaseService } from "../services/supabaseService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const passwordPolicy = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[!@#$%^&*]/, "Password must include a special character");

const registrationSchema = z.object({
  email: z.string().email(),
  password: passwordPolicy,
  goal: z.string().min(3, "Goal must be at least 3 characters long"),
  preferredPaceHoursPerWeek: z.coerce.number().int().positive().max(40).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resetRequestSchema = z.object({
  email: z.string().email(),
});

const resetConfirmSchema = z.object({
  token: z.string().uuid(),
  password: passwordPolicy,
});

const authRouter = Router();

const buildAuthResponse = async (userId: string) => {
  const user = await supabaseService.getUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return supabaseService.sanitizeUser(user);
};

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    const { email, password, goal, preferredPaceHoursPerWeek } = parsed.data;
    const plan = generateLearningPlan(goal, preferredPaceHoursPerWeek);
    const { userId, planId } = await supabaseService.registerUser(email, password, plan.goal, plan);
    const session = await supabaseService.createSession(userId);
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
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    const user = await supabaseService.verifyUserCredentials(parsed.data.email, parsed.data.password);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const session = await supabaseService.createSession(user.id);
    res.json({
      status: "success",
      data: {
        user: supabaseService.sanitizeUser(user),
        session,
      },
    });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.sessionToken) {
      await supabaseService.clearSession(req.sessionToken);
    }
    res.status(204).send();
  }),
);

authRouter.post(
  "/reset/request",
  asyncHandler(async (req, res) => {
    const parsed = resetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    const token = await supabaseService.createPasswordResetToken(parsed.data.email);
    res.json({
      status: "success",
      data: {
        resetToken: token ?? null,
      },
    });
  }),
);

authRouter.post(
  "/reset/confirm",
  asyncHandler(async (req, res) => {
    const parsed = resetConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    const success = await supabaseService.resetPassword(parsed.data.token, parsed.data.password);
    if (!success) {
      throw new AppError("Reset token invalid or expired", 400);
    }

    res.json({ status: "success" });
  }),
);

export { authRouter };
