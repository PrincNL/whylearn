import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/server";

describe("Express + Next integration", () => {
  it("keeps health route functional", async () => {
    const app = createApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("forwards unmatched routes to Next handler", async () => {
    const handler = vi.fn((_, res) => {
      res.status(200).json({ handledBy: "next" });
    });

    const app = createApp({ nextHandler: handler });
    const response = await request(app).get("/some/unknown/path");

    expect(handler).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.body.handledBy).toBe("next");
  });
});
