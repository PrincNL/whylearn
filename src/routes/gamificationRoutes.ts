import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/authMiddleware";
import { dataService } from "../services/dataService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const manualSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid().optional(),
  points: z.coerce.number().int().min(0).optional(),
  badgeCode: z.string().optional(),
});

export const gamificationRouter = Router();

gamificationRouter.use(requireAuth);

gamificationRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = manualSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const result = await dataService.applyManualGamification(parsed.data);
    res.status(200).json({ status: "success", data: result });
  }),
);

gamificationRouter.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const paramsSchema = z.object({
      userId: z.string().uuid(),
      planId: z.string().uuid().optional(),
    });
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId, planId: req.query.planId });
    if (!parsedParams.success) {
      throw new AppError("Validation failed", 422, parsedParams.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const status = await dataService.getGamificationStatus(
      parsedParams.data.userId,
      parsedParams.data.planId,
    );
    res.json({ status: "success", data: status });
  }),
);
