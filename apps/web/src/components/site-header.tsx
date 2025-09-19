"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/i18n";
import { useSubscriptionStatus } from "@/app/app/_hooks/use-subscription-status";

import { LanguageToggle } from "./language-toggle";

export function SiteHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="h-9 w-9 rounded-lg bg-primary/10 text-primary shadow-sm" aria-hidden="true" />
            <span className="hidden text-foreground sm:inline">{siteConfig.name}</span>
            <span className="sr-only">{siteConfig.name}</span>
          </Link>
          <nav aria-label={t("nav.primary")} className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            {siteConfig.mainNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {item.labelKey ? t(item.labelKey) : item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SubscriptionBadge />
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/auth/signup">{t("cta.startTrial")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SubscriptionBadge() {
  const { subscription, state, statusMeta } = useSubscriptionStatus();

  const label = useMemo(() => {
    if (state === "loading") {
      return "Checking tier";
    }
    const tier = subscription.tierId ?? "preview";
    if (statusMeta.category === "preview") {
      return "Preview tier";
    }
    if (statusMeta.category === "downgraded") {
      return `${tier} | Downgraded`;
    }
    return `${tier} | ${statusMeta.label}`;
  }, [state, subscription, statusMeta]);

  const attention = statusMeta.category === "grace" || statusMeta.category === "ended" || statusMeta.category === "downgraded" || statusMeta.category === "unknown";
  const baseClasses = "hidden rounded-full border px-3 py-1 text-xs font-medium md:inline-block";
  const tone = attention
    ? "border-destructive/60 bg-destructive/10 text-destructive"
    : "border-primary/40 bg-primary/10 text-primary";

  return <span className={`${baseClasses} ${tone}`}>{label}</span>;
}

