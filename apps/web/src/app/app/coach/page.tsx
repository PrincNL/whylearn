'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { PremiumGuard } from "../_components/premium-guard";
import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { apiGet, apiPost } from "../_lib/api-client";
import { demoCoaching } from "../_lib/demo-data";
import type { CoachingStatus } from "../_lib/types";

type LoadingState = "demo" | "loading" | "ready" | "error";

type CoachForm = {
  notes: string;
};

const fallbackStatus: CoachingStatus = {
  progress: {
    userId: "demo-user",
    planId: "demo-plan",
    goal: "Launch design leadership cohort",
    totalMilestones: 4,
    completedMilestones: 2,
    milestones: demoCoaching.map((entry, index) => ({
      milestoneId: `milestone-${index + 1}`,
      title: entry.recommendedActions[0] ?? "Focus milestone",
      status: index === 0 ? "completed" : "pending",
      progressTimestamp: entry.createdAt,
      points: 100,
      badgeCodes: [],
    })),
  },
  gamification: {
    userId: "demo-user",
    planId: "demo-plan",
    totalPoints: 1450,
    progressPoints: 1200,
    bonusPoints: 250,
    level: 3,
    completionRate: 0.5,
    completedMilestones: 2,
    totalMilestones: 4,
    badges: [],
  },
  history: demoCoaching.map((item) => ({
    id: item.id,
    userId: "demo-user",
    planId: "demo-plan",
    summary: item.summary,
    recommendedMilestones: item.recommendedActions,
    recommendedActions: item.recommendedActions,
    focusAreas: [],
    motivationalMessage: "Keep momentum strong!",
    planAdjustments: [],
    createdAt: item.createdAt,
  })),
  latestAdvice: undefined,
};

export default function CoachPage() {
  const { identity } = useDemoIdentity();
  const [status, setStatus] = useState<LoadingState>("demo");
  const [error, setError] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<CoachingStatus | null>(null);
  const [form, setForm] = useState<CoachForm>({ notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      setCoaching(null);
      setStatus("demo");
      setError(null);
      return;
    }

    const planQuery = identity.planId ? `?planId=${encodeURIComponent(identity.planId)}` : "";
    setStatus("loading");
    setError(null);
    try {
      const result = await apiGet<CoachingStatus>(identity, `/api/coaching/${identity.userId}${planQuery}`);
      setCoaching(result);
      setStatus("ready");
    } catch (fetchError) {
      setCoaching(null);
      setStatus("error");
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  const active = coaching ?? fallbackStatus;
  const latestAdvice = active.latestAdvice ?? active.history[0];

  const infoMessage = useMemo(() => {
    if (status === "loading") {
      return "Generating coaching snapshot...";
    }
    if (status === "ready") {
      return "Live coaching data loaded.";
    }
    if (status === "error") {
      return `Using demo coaching (${error ?? "error"}).`;
    }
    return "Demo coaching until identity is configured.";
  }, [status, error]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm({ notes: event.target.value });
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      setStatus("demo");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiPost(identity, "/api/coaching", {
        userId: identity.userId,
        planId: identity.planId || active.progress.planId,
        notes: form.notes || undefined,
      });
      setForm({ notes: "" });
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to generate coaching advice");
    } finally {
      setSubmitting(false);
    }
  };

  const preview = (
    <div className="space-y-2 text-left text-sm text-muted-foreground">
      <p>{demoCoaching[0]?.summary}</p>
      <ul className="list-disc space-y-1 pl-5">
        {(demoCoaching[0]?.recommendedActions ?? []).map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <PremiumGuard entitlement="ai_coaching" title="AI coaching snapshots" preview={preview}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Coaching assistant</h2>
            <p className="text-sm text-muted-foreground">Request new coaching snapshots and review recent guidance.</p>
          </div>
          <span className="text-xs text-muted-foreground">{infoMessage}</span>
        </div>

        <section className="rounded-2xl border border-border/60 bg-background p-5">
          <h3 className="text-lg font-semibold text-foreground">Latest advice</h3>
          {latestAdvice ? (
            <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-sm text-foreground">{latestAdvice.summary}</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {latestAdvice.recommendedActions.map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Generated {latestAdvice.createdAt}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Generate a coaching snapshot to see advice here.</p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Request new snapshot</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr,auto]" noValidate>
            <div className="space-y-1">
              <Label htmlFor="coach-notes">Context (optional)</Label>
              <Input
                id="coach-notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Notes to help tailor the advice"
              />
            </div>
            <div className="self-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Generating..." : "Generate"}
              </Button>
            </div>
          </form>
          {error && status !== "ready" ? <p className="text-xs text-destructive">{error}</p> : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">History</h3>
          <div className="grid gap-2">
            {active.history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border/60 bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{entry.summary}</span>
                  <span className="text-xs text-muted-foreground">{entry.createdAt}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: {entry.recommendedActions.join(', ') || '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PremiumGuard>
  );
}
