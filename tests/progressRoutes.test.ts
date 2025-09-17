import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";

const registerPayload = {
  email: "progress@example.com",
  password: "StrongP@ssw0rd1",
  goal: "learn testing",
};

describe("Progress routes", () => {
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

  it("requires authentication", async () => {
    const response = await request(app).get(`/api/progress/${userId}`);
    expect(response.status).toBe(401);
  });

  it("records task completion and returns gamification update", async () => {
    const milestoneId = "milestone-1";

    // mark completion
    const response = await request(app)
      .post("/api/progress")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        userId,
        milestoneId,
        status: "completed",
        planId,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.record.status).toBe("completed");
    expect(response.body.data.gamification.totalPoints).toBeGreaterThan(0);
  });

  it("retrieves progress overview for authenticated user", async () => {
    const overview = await request(app)
      .get(`/api/progress/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(overview.status).toBe(200);
    expect(overview.body.data.goal).toContain("Learn Testing");
  });
});
