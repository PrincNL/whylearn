import React from "react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import http from "node:http";

vi.mock("next/font/google", () => {
  const mockFont = (options: { variable?: string } = {}) => {
    const variable = options.variable ?? "--font-mock";
    return {
      className: "mock-font",
      variable,
      style: { fontFamily: "mock-font" },
    };
  };

  return {
    Geist: (options?: { variable?: string }) => mockFont(options ?? {}),
    Geist_Mono: (options?: { variable?: string }) => mockFont(options ?? {}),
  };
});

vi.mock("next/link", () => {
  const MockLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a"> & { href: string }>(
    ({ href, children, ...props }, ref) => {
      const resolvedHref = typeof href === "string" ? href : "#";
      return (
        <a ref={ref} href={resolvedHref} {...props}>
          {children}
        </a>
      );
    },
  );
  MockLink.displayName = "MockNextLink";
  return {
    __esModule: true,
    default: MockLink,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

process.env.NODE_ENV ||= "test";
process.env.PORT ||= "3001";

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

async function detectNetworkAccess(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const server = http.createServer();
      server.unref();
      server.once("error", (error) => {
        server.close();
        reject(error);
      });
      server.listen(0, "127.0.0.1", () => {
        server.close(() => resolve());
      });
    });
    return true;
  } catch (error) {
    return false;
  }
}

const hasAccess = await detectNetworkAccess();
(globalThis as any).__NETWORK_AVAILABLE__ = hasAccess;

(globalThis as any).React = React;
