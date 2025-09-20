'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { apiGet, apiPost } from "../_lib/api-client";
import { demoPlan } from "../_lib/demo-data";
import type { ProgressOverview } from "../_lib/types";

type LoadingState = "demo" | "loading" | "ready" | "error";

const buildFallbackOverview = (): ProgressOverview => ({
  userId: "demo-user",
  planId: "demo-plan",
  goal: demoPlan.goal,
  totalMilestones: demoPlan.milestones.length,
  completedMilestones: 2,
  milestones: demoPlan.milestones.map((milestone, index) => ({
    milestoneId: milestone.id,
    title: milestone.title,
    status: index < 2 ? "completed" : "pending",
    progressTimestamp: null,
    points: index < 2 ? 100 : 0,
    badgeCodes: [],
  })),
});

export default function LearnPage() {
  const { identity } = useDemoIdentity();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [state, setState] = useState<LoadingState>("demo");
  const [error, setError] = useState<string | null>(null);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);

    if (!hasIdentity) {
      setState("demo");
      setOverview(null);
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
        const result = await apiGet<ProgressOverview>(identity, `/api/progress/${identity.userId}${planQuery}`);
        if (cancelled) {
          return;
        }
        setOverview(result);
        setState("ready");
      } catch (fetchError) {
        if (cancelled) {
          return;
        }
        setOverview(null);
        setState("error");
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [identity]);

  const fallbackOverview = useMemo(() => buildFallbackOverview(), []);
  const activeOverview = overview ?? fallbackOverview;
  const planIdForMutation = identity.planId || overview?.planId || fallbackOverview.planId;

  const markComplete = useCallback(
    async (milestoneId: string) => {
      if (!identity.userId || !identity.sessionToken) {
        setState("demo");
        return;
      }

      setUpdatingMilestone(milestoneId);
      setOverview((current) => {
        if (!current) {
          return current;
        }
        const updatedMilestones = current.milestones.map((milestone) =>
          milestone.milestoneId === milestoneId
            ? { ...milestone, status: "completed", progressTimestamp: new Date().toISOString() }
            : milestone,
        );
        return {
          ...current,
          milestones: updatedMilestones,
          completedMilestones: updatedMilestones.filter((milestone) => milestone.status === "completed").length,
        };
      });

      try {
        await apiPost(identity, "/api/progress", {
          userId: identity.userId,
          planId: planIdForMutation,
          milestoneId,
          status: "completed",
        });
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update milestone");
      } finally {
        setUpdatingMilestone(null);
      }
    },
    [identity, planIdForMutation],
  );

  const infoMessage = (() => {
    if (state === "loading") {
      return "Fetching milestones...";
    }
    if (state === "ready") {
      return "Live data loaded.";
    }
    if (state === "error") {
      return `Showing demo data (${error ?? "error"}).`;
    }
    return "Demo milestones shown until you connect identity.";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Milestones</h2>
          <p className="text-sm text-muted-foreground">Check off tasks and push progress updates to the API.</p>
        </div>
        <span className="text-xs text-muted-foreground">{infoMessage}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {activeOverview.milestones.map((milestone) => (
          <article
            key={milestone.milestoneId}
            className={cn(
              "space-y-2 rounded-2xl border border-border/60 bg-background p-4",
              milestone.status === "completed" ? "border-primary/50" : "",
            )}
          >
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{milestone.title}</h3>
              <span className="text-xs uppercase text-muted-foreground">
                {milestone.status === "completed" ? "Completed" : "Pending"}
              </span>
            </header>
            <p className="text-xs text-muted-foreground">
              Points: {milestone.points ?? 0} | Badges: {milestone.badgeCodes.length}
            </p>
            <Button
              type="button"
              size="sm"
              variant={milestone.status === "completed" ? "outline" : "default"}
              disabled={milestone.status === "completed" || updatingMilestone === milestone.milestoneId}
              onClick={() => markComplete(milestone.milestoneId)}
            >
              {milestone.status === "completed"
                ? "Completed"
                : updatingMilestone === milestone.milestoneId
                  ? "Updating..."
                  : "Mark complete"}
            </Button>
          </article>
        ))}
      </div>

      {error && state === "error" ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
