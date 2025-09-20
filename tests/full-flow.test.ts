import request from "supertest";
import { afterEach, beforeEach, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";
import { describeIfNetwork } from "./helpers/network";

describeIfNetwork("JSON storage premium learning flow", () => {
  let cleanup: (() => void) | undefined;
  let app = createApp();

  beforeEach(async () => {
    const ctx = await setupTestStorage();
    cleanup = ctx.cleanup;
    app = createApp();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("registers, tracks progress, upgrades, and generates coaching advice", async () => {
    const register = await request(app).post("/api/auth/register").send({
      email: "flow@example.com",
      password: "StrongP@ssw0rd1",
      goal: "Master testing",
    });

    expect(register.status).toBe(201);
    const sessionToken: string = register.body.data.session.token;
    const userId: string = register.body.data.user.id;
    const planId: string = register.body.data.planId;
    const planMilestones: Array<{ id: string }> = register.body.data.plan.milestones;
    const primaryMilestoneId = planMilestones[0]?.id ?? "milestone-1";

    const authHeader = `Bearer ${sessionToken}`;

    const progress = await request(app)
      .post("/api/progress")
      .set("Authorization", authHeader)
      .send({ userId, planId, milestoneId: primaryMilestoneId, status: "completed" });

    expect(progress.status).toBe(200);
    expect(progress.body.data.gamification.totalPoints).toBeGreaterThan(0);

    const overview = await request(app)
      .get(`/api/progress/${userId}`)
      .set("Authorization", authHeader);

    expect(overview.status).toBe(200);
    expect(overview.body.data.completedMilestones).toBeGreaterThan(0);

    const manualReward = await request(app)
      .post("/api/gamification")
      .set("Authorization", authHeader)
      .send({ userId, planId, points: 25 });

    expect(manualReward.status).toBe(200);
    expect(manualReward.body.data.gamification.totalPoints).toBeGreaterThan(
      progress.body.data.gamification.totalPoints,
    );

    const upgrade = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", authHeader)
      .send({ userId, tierId: "tier-plus" });

    expect(upgrade.status).toBe(200);
    expect(upgrade.body.data.status).toBe("active");
    expect(upgrade.body.data.subscription.entitlements).toContain("ai_coaching");

    const coaching = await request(app)
      .post("/api/coaching")
      .set("Authorization", authHeader)
      .send({ userId, planId, notes: "Need focus" });

    expect(coaching.status).toBe(200);
    expect(coaching.body.data.advice.summary).toBeTruthy();

    const status = await request(app)
      .get(`/api/coaching/${userId}`)
      .set("Authorization", authHeader)
      .query({ planId });

    expect(status.status).toBe(200);
    expect(status.body.data.history.length).toBeGreaterThanOrEqual(1);
  });
});
