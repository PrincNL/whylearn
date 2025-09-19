import type { ReactNode } from "react";

import { AppNav } from "./_components/app-nav";
import { IdentityBanner } from "./_components/identity-banner";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/20">
      <div className="container flex min-h-[calc(100vh-4rem)] flex-col gap-6 py-10">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-foreground">Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Monitor plans, celebrate progress, and manage subscriptions from a single hub. Connect the API identity
              below to work with live data.
            </p>
          </div>
          <AppNav />
        </div>
        <IdentityBanner />
        <div className="flex-1">
          <div className="space-y-6 rounded-3xl border border-border/60 bg-background p-6 shadow-sm md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
