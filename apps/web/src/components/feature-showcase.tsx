"use client";

import { BarChart3, Compass, MessageSquare, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const iconComponents = {
  compass: Compass,
  barChart3: BarChart3,
  trophy: Trophy,
  messageSquare: MessageSquare,
} satisfies Record<string, LucideIcon>;

export type FeatureIcon = keyof typeof iconComponents;

export type FeatureItem = {
  title: string;
  description: string;
  icon: FeatureIcon;
  highlight?: string;
  accent?: string;
};

export function FeatureShowcase({ features }: { features: FeatureItem[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {features.map((feature, index) => {
        const Icon = iconComponents[feature.icon];
        const accent = feature.accent ?? "from-cyan-400/40 via-sky-500/20 to-transparent";
        const transitionDelay = `${index * 60}ms`;
        return (
          <article
            key={feature.title}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_32px_120px_-60px_rgba(56,189,248,0.7)] backdrop-blur transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_38px_140px_-80px_rgba(56,189,248,0.65)]"
            style={{ transitionDelay }}
          >
            <div
              className={cn(
                "pointer-events-none absolute -inset-px -z-10 rounded-[2rem] bg-gradient-to-br blur-xl opacity-0 transition-opacity duration-700",
                accent,
                "group-hover:opacity-70",
              )}
              aria-hidden="true"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 shadow-[0_15px_45px_-20px_rgba(59,130,246,0.9)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {feature.highlight ? (
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100/80">
                  {feature.highlight}
                </span>
              ) : null}
            </div>
            <h3 className="mt-6 text-lg font-semibold text-slate-50">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-300/90">{feature.description}</p>
          </article>
        );
      })}
    </div>
  );
}
