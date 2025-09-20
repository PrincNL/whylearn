import { describe, it, test } from "vitest";

const globalAny = globalThis as Record<string, unknown>;

const networkAvailable = Boolean(globalAny.__NETWORK_AVAILABLE__ ?? true);

export const describeIfNetwork = (
  name: Parameters<typeof describe>[0],
  factory: Parameters<typeof describe>[1],
) => {
  if (!networkAvailable) {
    describe.skip(name, () => {});
    return;
  }
  describe(name, factory);
};

export const itIfNetwork: typeof it = networkAvailable ? it : it.skip;
export const testIfNetwork: typeof test = networkAvailable ? test : test.skip;

export const hasNetworkAccess = networkAvailable;
