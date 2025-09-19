'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { apiGet } from "../_lib/api-client";
import { demoCoaching, demoPlan, demoProgress } from "../_lib/demo-data";
import type { CoachingStatus, GamificationStatus, ProgressOverview } from "../_lib/types";

interface DashboardState {
  progress: ProgressOverview | null;
  gamification: GamificationStatus | null;
  coaching: CoachingStatus | null;
}

type LoadingState = "demo" | "loading" | "ready" | "error";

const initialState: DashboardState = {
  progress: null,
  gamification: null,
  coaching: null,
};

export default function DashboardPage() {
  const { identity } = useDemoIdentity();
  const [data, setData] = useState<DashboardState>(initialState);
  const [status, setStatus] = useState<LoadingState>("demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);

    if (!hasIdentity) {
      setStatus("demo");
      setData(initialState);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    const planQuery = identity.planId ? `?planId=${encodeURIComponent(identity.planId)}` : "";

    const load = async () => {
      setStatus("loading");
      setError(null);
      try {
        const [progress, gamification, coaching] = await Promise.all([
          apiGet<ProgressOverview>(identity, `/api/progress/${identity.userId}${planQuery}`),
          apiGet<GamificationStatus>(identity, `/api/gamification/${identity.userId}${planQuery}`),
          apiGet<CoachingStatus>(identity, `/api/coaching/${identity.userId}${planQuery}`),
        ]);
        if (cancelled) {
          return;
        }
        setData({ progress, gamification, coaching });
        setStatus("ready");
      } catch (fetchError) {
        if (cancelled) {
          return;
        }
        setData(initialState);
        setStatus("error");
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [identity]);

  const progress = data.progress;
  const gamification = data.gamification;
  const latestAdvice = data.coaching?.latestAdvice;

  const completed = progress?.completedMilestones ?? demoProgress.completedMilestones;
  const total = progress?.totalMilestones ?? demoProgress.totalMilestones;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const points = gamification?.totalPoints ?? demoProgress.totalPoints;
  const streakDays = gamification?.completedMilestones ?? demoProgress.streakDays;

  const infoMessage = (() => {
    if (status === "loading") {
      return "Fetching live data...";
    }
    if (status === "ready") {
      return "Showing live data from the API.";
    }
    if (status === "error") {
      return `Falling back to demo content (${error ?? "request failed"}).`;
    }
    return "Demo content shown until you save an identity.";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Plan overview</h2>
          <p className="text-sm text-muted-foreground">Track milestones, streaks, and coaching signals at a glance.</p>
        </div>
        <span className="text-xs text-muted-foreground">{infoMessage}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Target className="h-4 w-4" aria-hidden="true" />
            Goal focus
          </div>
          <h3 className="text-lg font-semibold text-foreground">{progress?.goal ?? demoPlan.goal}</h3>
          <p className="text-sm text-muted-foreground">
            {demoPlan.motivation}
          </p>
          <div className="text-xs text-muted-foreground">
            {total} milestones | {demoPlan.milestones.reduce((acc, item) => acc + item.durationHours, 0)} planned hours
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/learn">Open learning plan</Link>
          </Button>
        </article>

        <article className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Flame className="h-4 w-4" aria-hidden="true" />
            Momentum
          </div>
          <p className="text-sm text-muted-foreground">Completion</p>
          <p className="text-3xl font-semibold text-foreground">{completionRate}%</p>
          <p className="text-sm text-muted-foreground">
            {completed} of {total} milestones complete
          </p>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <span>Points earned: {points}</span>
            <span>Active streak milestones: {streakDays}</span>
          </div>
        </article>

        <article className="space-y-3 rounded-2xl border border-border/60 bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            Next recommendation
          </div>
          <p className="rounded-md bg-background/70 p-3 text-sm text-foreground">
            {latestAdvice?.summary ?? demoCoaching[0]?.summary ?? "Generate a coaching snapshot to see guidance here."}
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {(latestAdvice?.recommendedActions ?? demoCoaching[0]?.recommendedActions ?? []).map((action) => (
              <li key={action} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="sm">
            <Link href="/app/coach">Open coaching</Link>
          </Button>
        </article>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Milestone timeline</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {(progress?.milestones ?? demoPlan.milestones.map((item) => ({
            milestoneId: item.id,
            title: item.title,
            status: item.id === "milestone-1" || item.id === "milestone-2" ? "completed" : "pending",
            progressTimestamp: null,
            points: 0,
            badgeCodes: [],
          }))).map((milestone) => (
            <div
              key={milestone.milestoneId}
              className={cn(
                "rounded-xl border border-border/60 p-4",
                milestone.status === "completed" ? "bg-primary/10" : "bg-background",
              )}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{milestone.title}</h4>
                <span className="text-xs text-muted-foreground">
                  {milestone.status === "completed" ? "Completed" : "Pending"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Points: {milestone.points ?? 0} | Badges: {milestone.badgeCodes?.length ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

