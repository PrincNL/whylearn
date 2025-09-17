import { Router } from "express";
import { z } from "zod";

import { requireAuth, requirePremium } from "../middleware/authMiddleware";
import { coachingService, type GenerateCoachingInput } from "../services/coachingService";
import { subscriptionService } from "../services/subscriptionService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const generateSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

const paramsSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid().optional(),
});

export const coachingRouter = Router();

coachingRouter.use(requireAuth);

const premiumGuard = requirePremium("ai_coaching");

coachingRouter.post(
  "/",
  premiumGuard,
  asyncHandler(async (req, res) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const payload: GenerateCoachingInput = { userId: parsed.data.userId };
    if (parsed.data.planId) {
      payload.planId = parsed.data.planId;
    }
    if (parsed.data.notes) {
      payload.notes = parsed.data.notes;
    }

    await subscriptionService.assertEntitlement(payload.userId, "ai_coaching");

    const session = await coachingService.generateSession(payload);
    res.status(200).json({ status: "success", data: session });
  }),
);

coachingRouter.get(
  "/:userId",
  premiumGuard,
  asyncHandler(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId, planId: req.query.planId });
    if (!parsedParams.success) {
      throw new AppError("Validation failed", 422, parsedParams.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    await subscriptionService.assertEntitlement(parsedParams.data.userId, "ai_coaching");

    const status = await coachingService.getCoachingStatus(
      parsedParams.data.userId,
      parsedParams.data.planId,
    );
    res.json({ status: "success", data: status });
  }),
);
