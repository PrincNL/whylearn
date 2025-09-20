'use client';

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { useSubscriptionStatus } from "../_hooks/use-subscription-status";

interface PremiumGuardProps {
  entitlement: string;
  title?: string;
  preview?: ReactNode;
  children: ReactNode;
}

type SubscriptionCategory = ReturnType<typeof useSubscriptionStatus>["statusMeta"]["category"];
type BlockingCategory = "downgraded" | "preview" | "grace" | "ended" | "unknown";

interface BlockingCopy {
  heading: string;
  message: string;
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
}

export function PremiumGuard({ entitlement, title, preview, children }: PremiumGuardProps) {
  const { subscription, state, statusMeta, isDemo } = useSubscriptionStatus();

  const normalizedTier = subscription.tierId ?? "preview";
  const hasEntitlement = subscription.entitlements.includes(entitlement);
  const allowPreviewAccess = statusMeta.category === "preview" && (isDemo || state === "demo");
  const canAccess = hasEntitlement && (statusMeta.isActive || allowPreviewAccess);

  if (state === "loading") {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
        Loading premium status...
      </div>
    );
  }

  if (canAccess) {
    return <>{children}</>;
  }

  const blockingCategory = resolveBlockingCategory(statusMeta.category, hasEntitlement);
  const { heading, message, primaryAction, secondaryAction } = buildBlockingCopy({
    category: blockingCategory,
    defaultTitle: title,
    statusLabel: statusMeta.label,
    tier: normalizedTier,
    entitlement,
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-6 text-center">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{heading}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {preview ? (
        <div className="rounded-xl border border-border/60 bg-background p-4 text-left text-sm text-muted-foreground">{preview}</div>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href={primaryAction.href}>{primaryAction.label}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Current tier: {normalizedTier} | Status: {statusMeta.label}
      </p>
    </div>
  );
}

const resolveBlockingCategory = (category: SubscriptionCategory, hasEntitlement: boolean): BlockingCategory => {
  if (category === "active") {
    return hasEntitlement ? "unknown" : "downgraded";
  }
  if (category === "downgraded") {
    return "downgraded";
  }
  if (category === "grace") {
    return "grace";
  }
  if (category === "ended") {
    return "ended";
  }
  if (category === "preview") {
    return "preview";
  }
  return "unknown";
};

const buildBlockingCopy = ({
  category,
  defaultTitle,
  statusLabel,
  tier,
  entitlement,
}: {
  category: BlockingCategory;
  defaultTitle?: string;
  statusLabel: string;
  tier: string;
  entitlement: string;
}): BlockingCopy => {
  const heading = defaultTitle ?? "Premium feature";
  let message = "Upgrade to unlock this experience.";
  let primaryAction = { label: "View plans", href: "/pricing" };
  let secondaryAction = { label: "Start trial", href: "/auth/signup?plan=pro" };

  switch (category) {
    case "grace":
      message = `Your subscription is ${statusLabel}. Manage billing to restore premium access.`;
      primaryAction = { label: "Manage billing", href: "/app/account" };
      secondaryAction = { label: "View plans", href: "/pricing" };
      break;
    case "ended":
      message = "This subscription ended. Renew to keep premium features available.";
      primaryAction = { label: "Renew subscription", href: "/app/account" };
      secondaryAction = { label: "Compare plans", href: "/pricing" };
      break;
    case "downgraded":
      message = `The ${tier} tier does not include this entitlement (${entitlement}). Upgrade to regain access.`;
      primaryAction = { label: "Upgrade plan", href: "/pricing" };
      secondaryAction = { label: "Manage billing", href: "/app/account" };
      break;
    case "preview":
      message = "Preview workspaces can explore data but need a premium plan to use this feature.";
      primaryAction = { label: "View plans", href: "/pricing" };
      secondaryAction = { label: "Start trial", href: "/auth/signup?plan=pro" };
      break;
    case "unknown":
    default:
      message = "We could not verify premium access. Refresh or check billing to continue.";
      primaryAction = { label: "Check subscription", href: "/app/account" };
      secondaryAction = { label: "View plans", href: "/pricing" };
      break;
  }

  return { heading, message, primaryAction, secondaryAction };
};
