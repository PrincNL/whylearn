import { describe, expect, it } from "vitest";

describe("web landing page", () => {
  it("exports a default page component", async () => {
    const mod = await import("../../apps/web/src/app/page");
    expect(typeof mod.default).toBe("function");
  });
});
