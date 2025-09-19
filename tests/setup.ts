import React from "react";
import "@testing-library/jest-dom";
import { vi } from "vitest";

process.env.NODE_ENV ||= "test";
process.env.PORT ||= "3001";

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

(globalThis as any).React = React;

