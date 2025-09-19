'use client';

import { useCallback, useEffect, useState } from "react";

import type { SubscriptionStatus } from "../_lib/types";
import { demoEntitlements } from "../_lib/demo-data";
import { apiGet } from "../_lib/api-client";
import { useDemoIdentity } from "./use-demo-identity";

type FetchState = "demo" | "idle" | "loading" | "ready" | "error";
type SubscriptionStateCategory = "active" | "grace" | "ended" | "downgraded" | "preview" | "unknown";

interface SubscriptionStatusMeta {
  normalized: string;
  category: SubscriptionStateCategory;
  label: string;
  isActive: boolean;
  isGracePeriod: boolean;
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const GRACE_STATUSES = new Set(["past_due", "unpaid", "incomplete", "incomplete_expired"]);
const ENDED_STATUSES = new Set(["canceled", "cancelled", "expired", "paused"]);
const DOWNGRADED_STATUSES = new Set(["downgraded", "scheduled_downgrade"]);

const fallbackSubscription: SubscriptionStatus = {
  userId: "demo-user",
  tierId: "preview",
  status: "trialing",
  currentPeriodEnd: "2025-10-10",
  entitlements: demoEntitlements.map((item) => item.code),
};

let cachedKey = "";
let cachedData: SubscriptionStatus | null = null;
let cachedState: FetchState = "demo";
let cachedError: string | null = null;
let inFlight: Promise<void> | null = null;

const identityKey = (identity: { userId: string; sessionToken: string; planId: string }) =>
  `${identity.userId}|${identity.sessionToken}`;

const normalizeStatus = (status: string | null | undefined) =>
  (status ? status.toLowerCase() : "unknown");

const formatStatusLabel = (status: string) => {
  if (!status || status === "unknown") {
    return "Unknown";
  }
  return status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const resolveSubscriptionMeta = (subscription: SubscriptionStatus): SubscriptionStatusMeta => {
  const normalizedStatus = normalizeStatus(subscription.status);
  const normalizedTier = subscription.tierId ? subscription.tierId.toLowerCase() : "";

  let category: SubscriptionStateCategory = "unknown";

  if (DOWNGRADED_STATUSES.has(normalizedStatus)) {
    category = "downgraded";
  } else if (ENDED_STATUSES.has(normalizedStatus)) {
    category = "ended";
  } else if (GRACE_STATUSES.has(normalizedStatus)) {
    category = "grace";
  } else if (ACTIVE_STATUSES.has(normalizedStatus)) {
    if (!normalizedTier || normalizedTier === "preview") {
      category = normalizedStatus === "trialing" ? "active" : "preview";
    } else {
      category = "active";
    }
  } else if (!normalizedTier || normalizedTier === "preview") {
    category = "preview";
  }

  const label = formatStatusLabel(normalizedStatus);
  const isActive = category === "active";
  const isGracePeriod = category === "grace";

  return {
    normalized: normalizedStatus,
    category,
    label,
    isActive,
    isGracePeriod,
  };
};

export function useSubscriptionStatus() {
  const { identity } = useDemoIdentity();
  const [state, setState] = useState<FetchState>(cachedState);
  const [data, setData] = useState<SubscriptionStatus | null>(cachedData);
  const [error, setError] = useState<string | null>(cachedError);

  const refresh = useCallback(async () => {
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      cachedKey = "";
      cachedData = null;
      cachedState = "demo";
      cachedError = null;
      setData(null);
      setState("demo");
      setError(null);
      return;
    }

    const key = identityKey(identity);
    if (cachedKey === key && cachedState === "ready") {
      setData(cachedData);
      setState(cachedState);
      setError(cachedError);
      return;
    }

    if (inFlight && cachedKey === key) {
      await inFlight;
      setData(cachedData);
      setState(cachedState);
      setError(cachedError);
      return;
    }

    setState("loading");
    cachedState = "loading";
    cachedKey = key;
    const load = async () => {
      try {
        const result = await apiGet<SubscriptionStatus>(identity, `/api/subscriptions/${identity.userId}`);
        cachedData = result;
        cachedState = "ready";
        cachedError = null;
      } catch (fetchError) {
        cachedData = null;
        cachedState = "error";
        cachedError = fetchError instanceof Error ? fetchError.message : "Unknown error";
      }
    };

    inFlight = load();
    await inFlight;
    inFlight = null;
    setData(cachedData);
    setState(cachedState);
    setError(cachedError);
  }, [identity]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscription = data ?? fallbackSubscription;
  const statusMeta = resolveSubscriptionMeta(subscription);

  return {
    identity,
    subscription,
    state,
    error,
    refresh,
    isDemo: state === "demo",
    statusMeta,
  };
}

