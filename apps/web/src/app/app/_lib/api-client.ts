'use client';

import type { DemoIdentity } from "../_hooks/use-demo-identity";

interface ApiError {
  message: string;
}

const buildHeaders = (identity: DemoIdentity) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (identity.sessionToken) {
    headers.append("Authorization", `Bearer ${identity.sessionToken}`);
  }
  return headers;
};

export async function apiGet<T>(identity: DemoIdentity, path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: buildHeaders(identity),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }
  const json = await response.json().catch(() => null);
  return ((json as { data?: T })?.data ?? json) as T;
}

export async function apiPost<T>(identity: DemoIdentity, path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: buildHeaders(identity),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }
  const json = await response.json().catch(() => null);
  return ((json as { data?: T })?.data ?? json) as T;
}
