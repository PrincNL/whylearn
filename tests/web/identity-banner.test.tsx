import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const updateIdentityMock = vi.fn();

vi.mock("@/app/app/_hooks/use-demo-identity", () => ({
  useDemoIdentity: () => ({
    identity: { userId: "", planId: "", sessionToken: "" },
    updateIdentity: updateIdentityMock,
  }),
}));

import { IdentityBanner } from "@/app/app/_components/identity-banner";

describe("IdentityBanner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("saves and clears identity values", async () => {
    const user = userEvent.setup();
    render(<IdentityBanner />);

    await user.type(screen.getByLabelText(/user id/i), "user-1");
    await user.type(screen.getByLabelText(/plan id/i), "plan-1");
    await user.type(screen.getByLabelText(/session token/i), "token-1");

    await user.click(screen.getByRole("button", { name: /save identity/i }));

    expect(updateIdentityMock).toHaveBeenCalledWith({
      userId: "user-1",
      planId: "plan-1",
      sessionToken: "token-1",
    });

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(updateIdentityMock).toHaveBeenCalledWith(null);
  });
});

