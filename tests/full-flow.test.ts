import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";

describe("JSON storage premium learning flow", () => {
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

    const progress = await request(app)
      .post("/api/progress")
      .set("Authorization", Bearer )
      .send({ userId, planId, milestoneId: "milestone-1", status: "completed" });

    expect(progress.status).toBe(200);
    expect(progress.body.data.gamification.totalPoints).toBeGreaterThan(0);

    const overview = await request(app)
      .get(/api/progress/)
      .set("Authorization", Bearer );

    expect(overview.status).toBe(200);
    expect(overview.body.data.completedMilestones).toBeGreaterThan(0);

    const manualReward = await request(app)
      .post("/api/gamification")
      .set("Authorization", Bearer )
      .send({ userId, planId, points: 25 });

    expect(manualReward.status).toBe(200);
    expect(manualReward.body.data.gamification.totalPoints).toBeGreaterThan(
      progress.body.data.gamification.totalPoints,
    );

    const upgrade = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", Bearer )
      .send({ userId, tierId: "tier-plus" });

    expect(upgrade.status).toBe(200);
    expect(upgrade.body.data.status).toBe("active");
    expect(upgrade.body.data.subscription.entitlements).toContain("ai_coaching");

    const coaching = await request(app)
      .post("/api/coaching")
      .set("Authorization", Bearer )
      .send({ userId, planId, notes: "Need focus" });

    expect(coaching.status).toBe(200);
    expect(coaching.body.data.advice.summary).toBeTruthy();

    const status = await request(app)
      .get(/api/coaching/)
      .set("Authorization", Bearer );

    expect(status.status).toBe(200);
    expect(status.body.data.history.length).toBeGreaterThanOrEqual(1);
  });
});
