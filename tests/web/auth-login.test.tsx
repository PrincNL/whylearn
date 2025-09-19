import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/auth/login/page";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoginPage", () => {
  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);
    const submit = screen.getByRole("button", { name: /sign in/i });

    await user.click(submit);

    expect(await screen.findByText("Enter a valid email")).toBeVisible();
    expect(await screen.findByText("Password is required")).toBeVisible();
  });

  it("handles successful login flow", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success" }),
    } as Response);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "passw0rd!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Login successful. Redirecting to your dashboard...",
    );
  });

  it("surfaces server error response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    } as Response);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "valid@example.com");
    await user.type(screen.getByLabelText("Password"), "passw0rd!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(fetchMock).toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
