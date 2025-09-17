import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/server";
import { setupTestStorage } from "./helpers/storage";

const registerPayload = {
  email: "learner@example.com",
  password: "StrongP@ssw0rd1",
  goal: "learn product design",
  preferredPaceHoursPerWeek: 6,
};

describe("Auth routes", () => {
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

  it("registers a user and returns session + plan", async () => {
    const response = await request(app).post("/api/auth/register").send(registerPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(registerPayload.email);
    expect(response.body.data.session.token).toBeDefined();
    expect(response.body.data.plan.goal).toContain("Learn Product Design");
  });

  it("logs in with valid credentials after registration", async () => {
    await request(app).post("/api/auth/register").send(registerPayload);

    const login = await request(app).post("/api/auth/login").send({
      email: registerPayload.email,
      password: registerPayload.password,
    });

    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(registerPayload.email);
    expect(login.body.data.session.token).toMatch(/.+/);
  });

  it("rejects invalid login", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "nope@example.com", password: "notright" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("issues and consumes password reset token", async () => {
    await request(app).post("/api/auth/register").send(registerPayload);

    const resetRequest = await request(app)
      .post("/api/auth/reset/request")
      .send({ email: registerPayload.email });

    expect(resetRequest.status).toBe(200);
    const token = resetRequest.body.data.resetToken;
    expect(token).toMatch(/.+/);

    const resetConfirm = await request(app)
      .post("/api/auth/reset/confirm")
      .send({ token, password: "AnotherP@ss1" });

    expect(resetConfirm.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: registerPayload.email, password: "AnotherP@ss1" });

    expect(login.status).toBe(200);
  });
});
