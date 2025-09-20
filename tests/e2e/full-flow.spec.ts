import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { test, expect } from "@playwright/test";

import { createApp } from "../../src/server";
import { setupTestStorage } from "../helpers/storage";

type Cleanup = () => void;

let baseURL: string;
let cleanup: Cleanup | undefined;
let server: Server;

test.beforeAll(async () => {
  const ctx = await setupTestStorage();
  cleanup = ctx.cleanup;
  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      baseURL = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  cleanup?.();
  cleanup = undefined;
});

test("signup to premium coaching flow", async ({ request }) => {
  const registerResponse = await request.post(`${baseURL}/api/auth/register`, {
    data: {
      email: "playwright-flow@example.com",
      password: "StrongP@ssw0rd1",
      goal: "Own the testing stack",
    },
  });

  expect(registerResponse.status()).toBe(201);
  const registerBody = await registerResponse.json();
  const token: string = registerBody.data.session.token;
  const userId: string = registerBody.data.user.id;
  const planId: string = registerBody.data.planId;
  const planMilestones: Array<{ id: string }> = registerBody.data.plan.milestones;
  const primaryMilestoneId = planMilestones[0]?.id ?? "milestone-1";

  const authHeaders = { Authorization: `Bearer ${token}` };

  const progressResponse = await request.post(`${baseURL}/api/progress`, {
    headers: authHeaders,
    data: { userId, planId, milestoneId: primaryMilestoneId, status: "completed" },
  });

  expect(progressResponse.status()).toBe(200);
  const progressBody = await progressResponse.json();
  expect(progressBody.data.gamification.totalPoints).toBeGreaterThan(0);

  const upgradeResponse = await request.post(`${baseURL}/api/subscriptions`, {
    headers: authHeaders,
    data: { userId, tierId: "tier-plus" },
  });

  expect(upgradeResponse.status()).toBe(200);
  const upgradeBody = await upgradeResponse.json();
  expect(upgradeBody.data.subscription.entitlements).toContain("ai_coaching");

  const coachingResponse = await request.post(`${baseURL}/api/coaching`, {
    headers: authHeaders,
    data: { userId, planId, notes: "Need motivational boost" },
  });

  expect(coachingResponse.status()).toBe(200);
  const coachingBody = await coachingResponse.json();
  expect(coachingBody.data.advice.summary).toBeTruthy();

  const premiumRouteResponse = await request.get(`${baseURL}/api/coaching/${userId}`, {
    headers: authHeaders,
    params: { planId },
  });

  expect(premiumRouteResponse.status()).toBe(200);
  const premiumBody = await premiumRouteResponse.json();
  expect(premiumBody.data.history.length).toBeGreaterThanOrEqual(1);
});
