'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { useSubscriptionStatus } from "../_hooks/use-subscription-status";
import { apiPost } from "../_lib/api-client";

export default function AccountPage() {
  const { identity, updateIdentity } = useDemoIdentity();
  const { setTheme, theme, resolvedTheme } = useTheme();
  const { subscription, state, error, refresh, statusMeta } = useSubscriptionStatus();
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const infoMessage = useMemo(() => {
    if (state === "loading") {
      return "Loading subscription...";
    }
    if (state === "ready") {
      return "Live subscription data loaded.";
    }
    if (state === "error") {
      return `Using demo subscription (${error ?? "error"}).`;
    }
    return "Demo subscription shown until identity is set.";
  }, [state, error]);

  const subscriptionNotice = useMemo(() => {
    if (statusMeta.category === "grace") {
      return {
        tone: "border-amber-400/60 bg-amber-100/10 text-amber-600",
        message: "Payment is past due. Manage billing to keep premium features active.",
      };
    }
    if (statusMeta.category === "ended") {
      return {
        tone: "border-destructive/60 bg-destructive/10 text-destructive",
        message: "This subscription ended. Renew to regain premium access.",
      };
    }
    if (statusMeta.category === "downgraded") {
      return {
        tone: "border-primary/50 bg-primary/10 text-primary",
        message: "Your current tier no longer includes every premium entitlement. Upgrade to unlock everything.",
      };
    }
    return null;
  }, [statusMeta]);

  const clearIdentity = () => updateIdentity(null);

  const handleCheckout = async (tierId: string) => {
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      setCheckoutState("error");
      setCheckoutMessage("Save an API identity first.");
      return;
    }

    setCheckoutState("loading");
    setCheckoutMessage(null);
    try {
      await apiPost(identity, "/api/subscriptions", {
        userId: identity.userId,
        tierId,
      });
      setCheckoutState("success");
      setCheckoutMessage(`Requested plan change to ${tierId}. Refreshing status...`);
      await refresh();
    } catch (checkoutError) {
      setCheckoutState("error");
      setCheckoutMessage(checkoutError instanceof Error ? checkoutError.message : "Unable to update subscription");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Account settings</h2>
          <p className="text-sm text-muted-foreground">Manage appearance and subscription context for your workspace.</p>
        </div>
        <span className="text-xs text-muted-foreground">{infoMessage}</span>
      </div>

      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <h3 className="text-lg font-semibold text-foreground">Theme</h3>
        <p className="text-sm text-muted-foreground">Current: {theme} (resolved {resolvedTheme}).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={resolvedTheme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
            Light
          </Button>
          <Button type="button" size="sm" variant={resolvedTheme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
          <Button type="button" size="sm" variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>
            System
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <h3 className="text-lg font-semibold text-foreground">Subscription</h3>
        <p className="text-sm text-muted-foreground">Tier: {subscription.tierId ?? "preview"} | Status: {statusMeta.label}</p>
        <p className="text-xs text-muted-foreground">Renews on: {subscription.currentPeriodEnd ?? "-"}</p>
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Entitlements</p>
          <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {subscription.entitlements.map((code) => (
              <li key={code} className="rounded-full border border-border/60 px-2 py-1">
                {code}
              </li>
            ))}
          </ul>
        </div>
        {subscriptionNotice ? (
          <div className={`mt-4 rounded-lg border px-3 py-2 text-xs ${subscriptionNotice.tone}`}>
            {subscriptionNotice.message}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => handleCheckout("pro")}>
            Mock upgrade to Pro
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => handleCheckout("preview")}>
            Downgrade to Preview
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/pricing">View plans</Link>
          </Button>
        </div>
        {checkoutMessage ? (
          <p className={`text-xs ${checkoutState === "error" ? "text-destructive" : "text-primary"}`}>{checkoutMessage}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <h3 className="text-lg font-semibold text-foreground">API session</h3>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div>User ID: {identity.userId || "not set"}</div>
          <div>Plan ID: {identity.planId || "not set"}</div>
          <div>Session token: {identity.sessionToken || "not set"}</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={clearIdentity}>
            Clear identity
          </Button>
        </div>
      </section>
    </div>
  );
}
