import request from "supertest";
import { afterEach, beforeEach, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";
import { describeIfNetwork } from "./helpers/network";

const registerPayload = {
  email: "coach@example.com",
  password: "StrongP@ssw0rd1",
  goal: "improve coaching",
};

describeIfNetwork("Coaching routes", () => {
  let cleanup: (() => void) | undefined;
  let app = createApp();
  let authToken = "";
  let userId = "";
  let planId = "";

  beforeEach(async () => {
    const ctx = await setupTestStorage();
    cleanup = ctx.cleanup;
    app = createApp();

    const register = await request(app).post("/api/auth/register").send(registerPayload);
    authToken = register.body.data.session.token;
    userId = register.body.data.user.id;
    planId = register.body.data.planId;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("rejects coaching access without premium", async () => {
    const response = await request(app)
      .post("/api/coaching")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ userId, planId });

    expect(response.status).toBe(402);
  });

  it("generates coaching session after upgrading subscription", async () => {
    await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ userId, tierId: "tier-plus" });

    const response = await request(app)
      .post("/api/coaching")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ userId, planId });

    expect(response.status).toBe(200);
    expect(response.body.data.progress.planId).toBe(planId);
  });
});
