import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";

const registerPayload = {
  email: "gamification@example.com",
  password: "StrongP@ssw0rd1",
  goal: "master gamification",
};

describe("Gamification routes", () => {
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

  const ensureOk = (response: request.Response) => {
    if (response.status !== 200) {
      throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(response.body)}`);
    }
  };

  it("applies manual gamification updates", async () => {
    const response = await request(app)
      .post("/api/gamification")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ userId, points: 50 });

    ensureOk(response);
    expect(response.body.data.gamification.totalPoints).toBeGreaterThan(0);
  });

  it("fetches gamification status", async () => {
    const response = await request(app)
      .get(`/api/gamification/${userId}`)
      .set("Authorization", `Bearer ${authToken}`);

    ensureOk(response);
    expect(response.body.data.totalPoints).toBeDefined();
  });
});
