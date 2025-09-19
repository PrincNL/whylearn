'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useDemoIdentity, type DemoIdentity } from "../_hooks/use-demo-identity";

export function IdentityBanner() {
  const { identity, updateIdentity } = useDemoIdentity();
  const [local, setLocal] = useState<DemoIdentity>(identity);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocal(identity);
  }, [identity]);

  const handleChange = (field: keyof DemoIdentity) => (event: ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setLocal((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateIdentity(local);
    setSaved(true);
  };

  const handleClear = () => {
    updateIdentity(null);
    setSaved(false);
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-muted/40 p-4">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">API identity</h2>
            <p className="text-xs text-muted-foreground">
              Store the user, plan, and session token to test API-backed flows from the UI.
            </p>
          </div>
          {saved ? <span className="text-xs text-primary">Saved</span> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="identity-user">User ID</Label>
            <Input id="identity-user" value={local.userId} onChange={handleChange("userId")} placeholder="uuid" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="identity-plan">Plan ID</Label>
            <Input id="identity-plan" value={local.planId} onChange={handleChange("planId")} placeholder="uuid" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="identity-session">Session token</Label>
            <Input
              id="identity-session"
              value={local.sessionToken}
              onChange={handleChange("sessionToken")}
              placeholder="token"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm">
            Save identity
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </form>
    </section>
  );
}



