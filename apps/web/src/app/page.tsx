import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  MessageSquare,
  Sparkles,
  Trophy
} from "lucide-react";

import { FeatureShowcase, type FeatureItem } from "@/components/feature-showcase";
import { Button } from "@/components/ui/button";

const features: FeatureItem[] = [
  {
    title: "Adaptive learning plans",
    description: "Turn your goals into a sequenced plan with milestones that adjust as you make progress.",
    icon: Compass,
    highlight: "Personal"
  },
  {
    title: "Progress intelligence",
    description: "Visualise streaks, totals, and focus time so you can identify the habits that compound.",
    icon: BarChart3,
  },
  {
    title: "Rewards that motivate",
    description: "Unlock badges, levels, and celebratory moments aligned with the effort you put in.",
    icon: Trophy,
  },
  {
    title: "Coach in your corner",
    description: "Capture coaching snapshots and apply AI-assisted nudges that keep the next step clear.",
    icon: MessageSquare,
  }
];

const highlights = [
  "Personal plans grounded in outcomes, not busywork",
  "Real-time progress insights and streak tracking",
  "Rewards and coaching nudges that keep momentum"
];

const testimonials = [
  {
    quote: "WhyLearn helps me convert big learning goals into weekly focus. The gentle nudges are spot on.",
    name: "Aisha R.",
    role: "Product designer"
  },
  {
    quote: "Our cohort keeps momentum because the progress and rewards loop is tangible and fun.",
    name: "Mateo G.",
    role: "Bootcamp mentor"
  },
  {
    quote: "The coaching snapshots make it easy to reflect and adjust without leaving the flow.",
    name: "Priya K.",
    role: "Independent consultant"
  }
];

const faqs = [
  {
    question: "Is there a free tier?",
    answer:
      "Yes. The preview tier lets you create plans, track progress, and explore rewards before upgrading."
  },
  {
    question: "How does AI support the coaching experience?",
    answer:
      "We use AI to draft suggestions and reflective prompts. You stay in control and can accept, tweak, or dismiss each nudge."
  },
  {
    question: "Can I export my learning data?",
    answer:
      "Absolutely. Everything is stored in portable JSON and can be exported at any time from your account settings."
  }
];

export default function Home() {
  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-background to-primary/10">
        <div className="container relative z-10 flex flex-col items-center gap-10 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Focused learning, powered by WhyLearn
          </span>
          <div className="flex flex-col gap-6">
            <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Everything you need to design, track, and celebrate deliberate learning.
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
              WhyLearn aligns coaching, progress tracking, and rewards so independent learners can build momentum without burning out.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="group">
              <Link href="/auth/signup">
                Start your plan
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs">
                View documentation
              </Link>
            </Button>
          </div>
          <ul className="grid gap-3 text-left sm:grid-cols-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" aria-hidden="true" />
        </div>
      </section>

      <section id="features" className="container flex flex-col gap-12 py-20">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Features</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Build a learning system that compounds</h2>
          <p className="max-w-2xl text-balance text-muted-foreground">
            WhyLearn pairs structured planning with progress analytics and rewarding experiences. Start small, stay consistent, and celebrate meaningful wins along the way.
          </p>
        </div>
        <FeatureShowcase features={features} />
      </section>

      <section id="progress" className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">Progress flywheel</span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
              Stay accountable with streaks, reflections, and rewards that feel earned.
            </h2>
            <p className="text-muted-foreground">
              Every progress update feeds your streaks, goal dashboards, and coaching insights. You always know what to do next and why it matters.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Daily streak cards", "Milestone retro prompts", "Reward history timeline", "Coach snapshot library"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">This week</span>
              <span className="text-xs text-primary">+12% vs last week</span>
            </div>
            <div className="space-y-3">
              <ProgressRow label="Milestones cleared" value="6 / 8" accent="bg-primary/20" />
              <ProgressRow label="Focus sessions" value="9" accent="bg-secondary/30" />
              <ProgressRow label="Points earned" value="1,450" accent="bg-accent/30" />
            </div>
            <p className="text-xs text-muted-foreground">
              Data shown is sample preview content. Your workspace updates in real time when you connect the API.
            </p>
          </div>
        </div>
      </section>

      <section className="container flex flex-col gap-12 py-20">
        <div className="flex flex-col gap-4 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-primary">Social proof</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Trusted by focused learners and coaches</h2>
          <p className="max-w-2xl text-balance text-muted-foreground">
            From independent professionals to peer learning cohorts, WhyLearn keeps teams aligned on the progress that matters.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-6 text-left shadow-sm">
              <p className="text-sm text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
              <footer className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-border/60 bg-muted/10 py-20">
        <div className="container grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</span>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Answers before you dive in</h2>
            <p className="text-muted-foreground">
              Need more detail? Explore the docs or reach out to our team - we are building WhyLearn with transparent feedback loops.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details key={item.question} className="group rounded-xl border border-border/60 bg-background p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
                  {item.question}
                  <span className="text-primary transition-transform group-open:rotate-90">{">"}</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="container flex flex-col items-center gap-6 py-20 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Ready to craft your next learning chapter?</h2>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Spin up your workspace, connect the API, and invite collaborators when you are ready. WhyLearn keeps your growth rhythm consistent.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/auth/signup">Create a free workspace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ProgressRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">{value}</span>
        <span className={`h-2 w-16 rounded-full ${accent}`} aria-hidden="true" />
      </div>
    </div>
  );
}

