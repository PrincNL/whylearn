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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 text-slate-100 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-100"
          >
            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400/60 to-blue-500/40 shadow-[0_12px_30px_-18px_rgba(56,189,248,0.8)]" aria-hidden="true" />
            <span className="hidden sm:inline">{siteConfig.name}</span>
            <span className="sr-only">{siteConfig.name}</span>
          </Link>
          <nav
            aria-label={t("nav.primary")}
            className="hidden gap-6 text-sm font-medium text-slate-300 md:flex"
          >
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                {item.labelKey ? t(item.labelKey) : item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SubscriptionBadge />
          <LanguageToggle />
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="hidden rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-[0_12px_30px_-18px_rgba(56,189,248,0.65)] md:inline-flex"
          >
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
  const baseClasses = "hidden rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] md:inline-block";
  const tone = attention
    ? "border-amber-300/50 bg-amber-400/15 text-amber-200"
    : "border-cyan-300/50 bg-cyan-400/15 text-cyan-200";

  return <span className={`${baseClasses} ${tone}`}>{label}</span>;
}
