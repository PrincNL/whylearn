'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useDemoIdentity } from "../_hooks/use-demo-identity";
import { apiGet, apiPost } from "../_lib/api-client";
import { demoBadges, demoProgress } from "../_lib/demo-data";
import type { GamificationStatus } from "../_lib/types";

type LoadingState = "demo" | "loading" | "ready" | "error";

type RewardForm = {
  points: string;
  badgeCode: string;
};

const fallbackStatus: GamificationStatus = {
  userId: "demo-user",
  planId: "demo-plan",
  totalPoints: demoProgress.totalPoints,
  progressPoints: 1200,
  bonusPoints: 250,
  level: 3,
  completionRate: demoProgress.completedMilestones / demoProgress.totalMilestones,
  completedMilestones: demoProgress.completedMilestones,
  totalMilestones: demoProgress.totalMilestones,
  badges: demoBadges.map((badge) => ({
    code: badge.code,
    name: badge.name,
    description: "Demo badge",
    awardedAt: badge.earnedAt,
  })),
};

export default function RewardsPage() {
  const { identity } = useDemoIdentity();
  const [status, setStatus] = useState<LoadingState>("demo");
  const [error, setError] = useState<string | null>(null);
  const [gamification, setGamification] = useState<GamificationStatus | null>(null);
  const [form, setForm] = useState<RewardForm>({ points: "", badgeCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = async () => {
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      setGamification(null);
      setStatus("demo");
      setError(null);
      return;
    }

    const planQuery = identity.planId ? `?planId=${encodeURIComponent(identity.planId)}` : "";
    setStatus("loading");
    setError(null);
    try {
      const result = await apiGet<GamificationStatus>(identity, `/api/gamification/${identity.userId}${planQuery}`);
      setGamification(result);
      setStatus("ready");
    } catch (fetchError) {
      setGamification(null);
      setStatus("error");
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  const active = useMemo(() => gamification ?? fallbackStatus, [gamification]);

  const infoMessage = (() => {
    if (status === "loading") {
      return "Loading rewards...";
    }
    if (status === "ready") {
      return "Live rewards data loaded.";
    }
    if (status === "error") {
      return `Using demo rewards (${error ?? "error"}).`;
    }
    return "Demo rewards until identity is configured.";
  })();

  const handleChange = (field: keyof RewardForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setSuccessMessage(null);
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasIdentity = Boolean(identity.userId && identity.sessionToken);
    if (!hasIdentity) {
      setStatus("demo");
      return;
    }

    const pointsValue = form.points.trim() ? Number(form.points.trim()) : undefined;
    const badgeValue = form.badgeCode.trim() || undefined;
    if (!pointsValue && !badgeValue) {
      setError("Enter points or a badge code.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiPost(identity, "/api/gamification", {
        userId: identity.userId,
        planId: identity.planId || active.planId,
        points: pointsValue,
        badgeCode: badgeValue,
      });
      setSuccessMessage("Reward applied.");
      setForm({ points: "", badgeCode: "" });
      await refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to apply reward");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Rewards & badges</h2>
          <p className="text-sm text-muted-foreground">
            Review earned badges, total points, and trigger manual rewards for testing.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{infoMessage}</span>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs uppercase text-muted-foreground">Total points</p>
          <p className="text-2xl font-semibold text-foreground">{active.totalPoints}</p>
          <p className="text-xs text-muted-foreground">Progress {active.progressPoints} | Bonus {active.bonusPoints}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs uppercase text-muted-foreground">Level</p>
          <p className="text-2xl font-semibold text-foreground">{active.level}</p>
          <p className="text-xs text-muted-foreground">Completion {(active.completionRate * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="text-xs uppercase text-muted-foreground">Badges earned</p>
          <p className="text-2xl font-semibold text-foreground">{active.badges.length}</p>
          <p className="text-xs text-muted-foreground">Latest {active.badges[0]?.name ?? '—'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Badge history</h3>
        <div className="grid gap-2">
          {active.badges.map((badge) => (
            <div key={badge.code} className="rounded-xl border border-border/60 bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{badge.name}</span>
                <span className="text-xs text-muted-foreground">Awarded {badge.awardedAt}</span>
              </div>
              <p className="text-xs text-muted-foreground">{badge.description ?? 'Custom badge'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Manual reward (admin)</h3>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr,1fr,auto]" noValidate>
          <div className="space-y-1">
            <Label htmlFor="reward-points">Points</Label>
            <Input
              id="reward-points"
              value={form.points}
              onChange={handleChange("points")}
              placeholder="e.g. 150"
              type="number"
              min={0}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reward-badge">Badge code</Label>
            <Input
              id="reward-badge"
              value={form.badgeCode}
              onChange={handleChange("badgeCode")}
              placeholder="first_milestone"
            />
          </div>
          <div className="self-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Applying..." : "Apply"}
            </Button>
          </div>
        </form>
        {successMessage ? <p className="text-xs text-primary">{successMessage}</p> : null}
        {error && status !== "ready" ? <p className="text-xs text-destructive">{error}</p> : null}
      </section>
    </div>
  );
}


