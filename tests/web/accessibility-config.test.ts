import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import { messages } from "@/i18n/messages";

const requiredNavKeys = [
  "nav.features",
  "nav.progress",
  "nav.pricing",
  "nav.docs",
  "nav.dashboard",
  "nav.rewards",
  "nav.account",
  "nav.coach",
  "nav.learn",
  "nav.support",
  "nav.primary",
];

const footerKeys = ["footer.product", "footer.company", "footer.resources"];

const languages = ["en", "nl"] as const;

describe("i18n messages", () => {
  it("provides required navigation translations", () => {
    for (const locale of languages) {
      for (const key of requiredNavKeys) {
        expect(messages[locale][key]).toBeTruthy();
      }
    }
  });

  it("includes footer and call-to-action translations", () => {
    for (const locale of languages) {
      for (const key of footerKeys) {
        expect(messages[locale][key]).toBeTruthy();
      }
      expect(messages[locale]["cta.startTrial"]).toBeTruthy();
    }
  });
});

describe("site configuration", () => {
  it("maps navigation items to translation keys", () => {
    const navKeys = siteConfig.mainNav.map((item) => item.labelKey).filter(Boolean);
    expect(navKeys).toContain("nav.features");
    expect(navKeys).toContain("nav.pricing");
  });

  it("ensures footer sections expose translation keys", () => {
    expect(siteConfig.footer.product.every((link) => link.labelKey)).toBe(true);
    expect(siteConfig.footer.resources.every((link) => link.labelKey || link.title)).toBe(true);
  });
});

