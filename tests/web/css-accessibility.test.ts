import { describe, expect, it } from "vitest";

import fs from "node:fs";
import path from "node:path";

const cssPath = path.resolve(__dirname, "../../apps/web/src/app/globals.css");
const css = fs.readFileSync(cssPath, "utf-8");

describe("global styles", () => {
  it("defines a skip link block", () => {
    expect(css).toContain(".skip-link");
    expect(css).toContain("outline: 2px solid");
  });

  it("honours reduced motion preferences", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 0.01ms");
  });
});
