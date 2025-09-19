import * as React from 'react';
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useI18n: () => ({ locale: "en", setLocale: vi.fn(), t: (key: string) => key }),
}));

import { LanguageToggle } from "@/components/language-toggle";

describe("LanguageToggle", () => {
  it("toggles locale indicator", async () => {
    const user = userEvent.setup();

    render(<LanguageToggle />);

    const button = screen.getByRole("button", { name: /language.toggle/i });
    expect(button).toHaveTextContent("EN");

    await user.click(button);
    expect(button).toHaveTextContent("NL");
  });
});

