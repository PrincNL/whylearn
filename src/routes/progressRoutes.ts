import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/authMiddleware";
import { dataService } from "../services/dataService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const statusSchema = z.enum(["pending", "completed"]);

const upsertSchema = z.object({
  userId: z.string().uuid(),
  milestoneId: z.string().min(1),
  status: statusSchema.default("completed"),
  planId: z.string().uuid().optional(),
  progressTimestamp: z.string().datetime().optional(),
});

const paramsSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid().optional(),
});

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const { planId, progressTimestamp, ...rest } = parsed.data;
    const payload: Parameters<typeof dataService.upsertTaskProgress>[0] = { ...rest };
    if (planId) {
      payload.planId = planId;
    }
    if (progressTimestamp) {
      payload.progressTimestamp = progressTimestamp;
    }

    const result = await dataService.upsertTaskProgress(payload);
    res.status(200).json({ status: "success", data: result });
  }),
);

progressRouter.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({
      userId: req.params.userId,
      planId: req.query.planId,
    });
    if (!parsedParams.success) {
      throw new AppError("Validation failed", 422, parsedParams.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const overview = await dataService.getProgressOverview(
      parsedParams.data.userId,
      parsedParams.data.planId,
    );
    res.json({ status: "success", data: overview });
  }),
);
