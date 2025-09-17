import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateLearningPlan } from "../src/services/learningPlanService";
import { supabaseService } from "../src/services/supabaseService";
import { setupTestStorage } from "./helpers/storage";

describe("SupabaseService gamification", () => {
  let cleanup: (() => void) | undefined;
  let userId = "";
  let planId = "";
  let plan = generateLearningPlan("data analysis");

  beforeEach(async () => {
    const ctx = await setupTestStorage();
    cleanup = ctx.cleanup;
    plan = generateLearningPlan("data analysis");
    const result = await supabaseService.registerUser(
      "learner@example.com",
      "StrongP@ssw0rd1",
      plan.goal,
      plan,
    );
    userId = result.userId;
    planId = result.planId;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("awards points and badges when completing milestones", async () => {
    const milestoneId = plan.milestones[0].id;
    const outcome = await supabaseService.upsertTaskProgress({
      userId,
      milestoneId,
      status: "completed",
      planId,
    });

    expect(outcome.record.status).toBe("completed");
    expect(outcome.newBadges.some((badge) => badge.code === "first_milestone")).toBe(true);
    expect(outcome.gamification.totalPoints).toBeGreaterThan(0);
  });

  it("applies manual gamification rewards and returns status", async () => {
    const milestoneId = plan.milestones[0].id;
    await supabaseService.upsertTaskProgress({
      userId,
      milestoneId,
      status: "completed",
      planId,
    });

    const result = await supabaseService.applyManualGamification({
      userId,
      planId,
      points: 75,
      badgeCode: "plan_completed",
    });

    expect(result.gamification.bonusPoints).toBeGreaterThanOrEqual(75);
    expect(result.newBadges.some((badge) => badge.code === "plan_completed")).toBe(true);
    expect(result.gamification.totalPoints).toBeGreaterThan(result.gamification.progressPoints);
  });
});
