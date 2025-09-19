"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  highlight?: string;
};

export function FeatureShowcase({ features }: { features: FeatureItem[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <motion.article
            key={feature.title}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? undefined : { delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
            whileHover={shouldReduceMotion ? undefined : { translateY: -4 }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {feature.highlight ? (
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {feature.highlight}
                </span>
              ) : null}
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </motion.article>
        );
      })}
    </div>
  );
}
