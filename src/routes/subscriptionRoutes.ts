import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/authMiddleware";
import { subscriptionService, type SubscriptionChangeRequest } from "../services/subscriptionService";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

const changeSchema = z.object({
  userId: z.string().uuid(),
  tierId: z.string().min(1),
  paymentMethodId: z.string().optional(),
  couponId: z.string().optional(),
});

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

export const subscriptionRouter = Router();

subscriptionRouter.use(requireAuth);

subscriptionRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = changeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError("Validation failed", 422, parsed.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsed.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const payload: SubscriptionChangeRequest = {
      userId: parsed.data.userId,
      tierId: parsed.data.tierId,
      paymentMethodId: parsed.data.paymentMethodId,
      couponId: parsed.data.couponId,
    };

    const result = await subscriptionService.changeSubscription(payload);
    res.status(200).json({ status: "success", data: result });
  }),
);

subscriptionRouter.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    const parsedParams = paramsSchema.safeParse({ userId: req.params.userId });
    if (!parsedParams.success) {
      throw new AppError("Validation failed", 422, parsedParams.error.flatten());
    }

    if (!req.authUser || req.authUser.id !== parsedParams.data.userId) {
      throw new AppError("Forbidden", 403);
    }

    const status = await subscriptionService.getSubscriptionStatus(parsedParams.data.userId);
    res.json({ status: "success", data: status });
  }),
);
