import Link from "next/link";

import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Preview",
    price: "Free",
    description: "Plan, track, and explore the experience before upgrading.",
    cta: "Start for free",
    href: "/auth/signup",
    features: ["Goal-based learning plans", "Progress dashboard", "Motivation nudges"],
  },
  {
    name: "Pro",
    price: "$18/mo",
    description: "Unlock streak analytics, advanced rewards, and team invites.",
    cta: "Upgrade to Pro",
    href: "/auth/signup?plan=pro",
    features: [
      "All Preview features",
      "Focus analytics & streak insights",
      "Team workspaces (up to 5 members)",
    ],
    highlight: "Most popular",
  },
  {
    name: "Elite",
    price: "$39/mo",
    description: "Scale learning operations with automations and premium coaching.",
    cta: "Talk to sales",
    href: "mailto:sales@whylearn.ai",
    features: [
      "All Pro features",
      "AI coaching snapshots with playbooks",
      "Dedicated onboarding session",
    ],
  },
] as const;

const matrix = [
  { feature: "Adaptive learning plans", preview: true, pro: true, elite: true },
  { feature: "Gamified rewards", preview: "Limited", pro: "Full", elite: "Full" },
  { feature: "Progress analytics", preview: "Basic", pro: "Advanced", elite: "Advanced + exports" },
  { feature: "Team collaboration", preview: "Single", pro: "Up to 5", elite: "Unlimited" },
  { feature: "AI coaching", preview: "Sample prompts", pro: "Monthly snapshot", elite: "Unlimited with automations" },
];

export default function PricingPage() {
  return (
    <div className="container flex flex-col gap-16 py-20">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
          Pricing
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Choose the momentum that matches your goals
        </h1>
        <p className="max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
          Every plan keeps your data portable and privacy-first. Upgrade when you need richer analytics or coaching.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className="flex h-full flex-col gap-6 rounded-2xl border border-border/60 bg-background p-6 shadow-sm"
          >
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{tier.name}</h2>
                {tier.highlight ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {tier.highlight}
                  </span>
                ) : null}
              </div>
              <p className="text-3xl font-bold text-foreground">{tier.price}</p>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-3 text-left text-sm text-muted-foreground">
              {tier.features.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full">
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </article>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Feature matrix</h2>
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full divide-y divide-border/60 text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Pro</th>
                <th className="px-4 py-3 font-medium">Elite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {matrix.map((row) => (
                <tr key={row.feature} className="bg-background/60">
                  <td className="px-4 py-3 text-foreground">{row.feature}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof row.preview === "boolean" ? (row.preview ? "Included" : "—") : row.preview}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof row.pro === "boolean" ? (row.pro ? "Included" : "—") : row.pro}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeof row.elite === "boolean" ? (row.elite ? "Included" : "—") : row.elite}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-primary/10 p-10 text-center">
        <h2 className="text-3xl font-semibold text-primary">Ready to upgrade?</h2>
        <p className="max-w-xl text-sm text-primary/80">
          Invite your team, unlock deeper analytics, and activate premium coaching when you step up to Pro or Elite.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/auth/signup?plan=pro">Upgrade now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="mailto:sales@whylearn.ai">Book a walkthrough</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
