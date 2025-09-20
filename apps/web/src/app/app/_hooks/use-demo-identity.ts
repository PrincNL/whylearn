'use client';

import { useEffect, useState } from "react";

export interface DemoIdentity {
  userId: string;
  planId: string;
  sessionToken: string;
}

type IdentityUpdate = Partial<DemoIdentity> | null;

const STORAGE_KEY = "whylearn-demo-identity";

const emptyIdentity: DemoIdentity = {
  userId: "",
  planId: "",
  sessionToken: "",
};

const readStorage = (): DemoIdentity => {
  if (typeof window === "undefined") {
    return emptyIdentity;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return emptyIdentity;
    }
    const parsed = JSON.parse(stored) as DemoIdentity;
    if (!parsed || typeof parsed !== "object") {
      return emptyIdentity;
    }
    return {
      userId: parsed.userId ?? "",
      planId: parsed.planId ?? "",
      sessionToken: parsed.sessionToken ?? "",
    };
  } catch (error) {
    console.warn("Unable to parse stored identity", error);
    return emptyIdentity;
  }
};

const writeStorage = (identity: DemoIdentity) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
};

export function useDemoIdentity() {
  const [identity, setIdentity] = useState<DemoIdentity>(emptyIdentity);

  useEffect(() => {
    setIdentity(readStorage());
  }, []);

  const updateIdentity = (update: IdentityUpdate) => {
    setIdentity((current) => {
      if (!update) {
        writeStorage(emptyIdentity);
        return emptyIdentity;
      }
      const next: DemoIdentity = {
        ...current,
        ...update,
      };
      writeStorage(next);
      return next;
    });
  };

  return {
    identity,
    updateIdentity,
  };
}
