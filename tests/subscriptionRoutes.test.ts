import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";

const registerPayload = {
  email: "subscription@example.com",
  password: "StrongP@ssw0rd1",
  goal: "premium learning",
};

describe("Subscription routes", () => {
  let cleanup: (() => void) | undefined;
  let app = createApp();
  let authToken = "";
  let userId = "";

  beforeEach(async () => {
    const ctx = await setupTestStorage();
    cleanup = ctx.cleanup;
    app = createApp();

    const register = await request(app).post("/api/auth/register").send(registerPayload);
    authToken = register.body.data.session.token;
    userId = register.body.data.user.id;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("updates subscription tier", async () => {
    const response = await request(app)
      .post("/api/subscriptions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ userId, tierId: "tier-plus" });

    expect(response.status).toBe(200);
    expect(response.body.data.subscription.tierId).toBe("tier-plus");
  });

  it("returns subscription status", async () => {
    const response = await request(app)
      .get(`/api/subscriptions/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("canceled");
  });
});
