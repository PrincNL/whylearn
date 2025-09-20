'use client';

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { apiGet } from "../_lib/api-client";
import { demoBadges, demoPlan, demoProgress } from "../_lib/demo-data";
import type { GamificationStatus, ProgressOverview } from "../_lib/types";

type LoadingState = "demo" | "loading" | "ready" | "error";

const buildFallback = () => ({
  overview: {
    userId: "demo-user",
    planId: "demo-plan",
    goal: demoPlan.goal,
    totalMilestones: demoPlan.milestones.length,
    completedMilestones: demoProgress.completedMilestones,
    milestones: demoPlan.milestones.map((milestone, index) => ({
      milestoneId: milestone.id,
      title: milestone.title,
      status: index < demoProgress.completedMilestones ? "completed" : "pending",
      progressTimestamp: null,
      points: index < demoProgress.completedMilestones ? 100 : 0,
      badgeCodes: index === 0 ? ["first_milestone"] : [],
    })),
  } satisfies ProgressOverview,
  gamification: {
    userId: "demo-user",
    planId: "demo-plan",
    totalPoints: demoProgress.totalPoints,
    progressPoints: 1200,
    bonusPoints: 250,
    level: 3,
    completionRate: demoProgress.completedMilestones / demoPlan.milestones.length,
    completedMilestones: demoProgress.completedMilestones,
    totalMilestones: demoPlan.milestones.length,
    badges: demoBadges.map((badge) => ({
      code: badge.code,
      name: badge.name,
      description: "Demo badge",
      awardedAt: badge.earnedAt,
    })),
  } satisfies GamificationStatus,
});

export default function ProgressPage() {
  const { identity } = useDemoIdentity();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [gamification, setGamification] = useState<GamificationStatus | null>(null);
  const [state, setState] = useState<LoadingState>("demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);

    if (!hasIdentity) {
      setOverview(null);
      setGamification(null);
      setState("demo");
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const planQuery = identity.planId ? `?planId=${encodeURIComponent(identity.planId)}` : "";

    const load = async () => {
      setState("loading");
      setError(null);
      try {
        const [nextOverview, nextGamification] = await Promise.all([
          apiGet<ProgressOverview>(identity, `/api/progress/${identity.userId}${planQuery}`),
          apiGet<GamificationStatus>(identity, `/api/gamification/${identity.userId}${planQuery}`),
        ]);
        if (cancelled) {
          return;
        }
        setOverview(nextOverview);
        setGamification(nextGamification);
        setState("ready");
      } catch (fetchError) {
        if (cancelled) {
          return;
        }
        setOverview(null);
        setGamification(null);
        setState("error");
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [identity]);

  const fallback = useMemo(() => buildFallback(), []);
  const activeOverview = overview ?? fallback.overview;
  const activeGamification = gamification ?? fallback.gamification;

  const completionPercent = activeOverview.totalMilestones
    ? Math.round((activeOverview.completedMilestones / activeOverview.totalMilestones) * 100)
    : 0;
  const progressBarWidth = `${Math.min(100, Math.max(0, completionPercent))}%`;

  const infoMessage = (() => {
    if (state === "loading") {
      return "Fetching live analytics...";
    }
    if (state === "ready") {
      return "Live analytics loaded.";
    }
    if (state === "error") {
      return `Showing demo analytics (${error ?? "error"}).`;
    }
    return "Demo analytics rendered until identity is set.";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Progress analytics</h2>
          <p className="text-sm text-muted-foreground">
            Monitor completion, streaks, and badge momentum across your learning plan.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{infoMessage}</span>
      </div>

      <section className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-background p-6">
          <header className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Total completion</span>
            <span>{completionPercent}%</span>
          </header>
          <div className="mt-3 h-3 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: progressBarWidth }} aria-hidden="true" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {activeOverview.completedMilestones} of {activeOverview.totalMilestones} milestones complete.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground">Total points</p>
            <p className="text-2xl font-semibold text-foreground">{activeGamification.totalPoints}</p>
            <p className="text-xs text-muted-foreground">Progress {activeGamification.progressPoints} | Bonus {activeGamification.bonusPoints}</p>
          </article>
          <article className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground">Level</p>
            <p className="text-2xl font-semibold text-foreground">{activeGamification.level}</p>
            <p className="text-xs text-muted-foreground">Completion rate {(activeGamification.completionRate * 100).toFixed(0)}%</p>
          </article>
          <article className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p className="text-xs uppercase text-muted-foreground">Badges earned</p>
            <p className="text-2xl font-semibold text-foreground">{activeGamification.badges.length}</p>
            <p className="text-xs text-muted-foreground">Most recent: {activeGamification.badges[0]?.name ?? '—'}</p>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Milestone detail</h3>
        <div className="grid gap-2">
          {activeOverview.milestones.map((milestone) => (
            <div
              key={milestone.milestoneId}
              className={cn(
                "rounded-xl border border-border/60 bg-background p-4",
                milestone.status === "completed" ? "border-primary/60" : "",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{milestone.title}</span>
                <span className="text-xs text-muted-foreground">
                  {milestone.status === "completed" ? "Completed" : "Pending"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Points {milestone.points ?? 0} | Badges {milestone.badgeCodes.length} | Last update{' '}
                {milestone.progressTimestamp ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

