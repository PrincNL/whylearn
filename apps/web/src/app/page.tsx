import Link from "next/link";
import { ArrowRight, Flame, Sparkles, Stars } from "lucide-react";

import { FeatureShowcase, type FeatureItem } from "@/components/feature-showcase";
import { Button } from "@/components/ui/button";

const heroStats = [
  {
    label: "Daily streak retention",
    value: "92%",
    meta: "+18% vs last month",
    accent: "from-cyan-400/40 to-sky-500/30",
  },
  {
    label: "Sessions finished",
    value: "12.4k",
    meta: "per week",
    accent: "from-fuchsia-400/30 to-violet-500/30",
  },
  {
    label: "Reward claim rate",
    value: "87%",
    meta: "Across premium cohorts",
    accent: "from-emerald-400/30 to-teal-500/30",
  },
];

const features: FeatureItem[] = [
  {
    title: "Neuroadaptive focus loops",
    description:
      "Design streak-powered routines that auto-adjust to your energy and keep your reward chemistry thriving.",
    icon: "compass",
    highlight: "Flowstate",
    accent: "from-cyan-400/50 via-sky-500/25 to-transparent",
  },
  {
    title: "Progress intelligence",
    description:
      "Feel the dopamine drip as dashboards surface streaks, velocity, and the exact nudge to stay accountable.",
    icon: "barChart3",
    highlight: "Signals",
    accent: "from-blue-400/40 via-indigo-500/20 to-transparent",
  },
  {
    title: "Reward cinematics",
    description:
      "Unlock micro-celebrations, levels, and limited badges tied to consistent effort – not cheap hits.",
    icon: "trophy",
    highlight: "Momentum",
    accent: "from-amber-400/45 via-orange-500/25 to-transparent",
  },
  {
    title: "Coach in your corner",
    description:
      "Capture snapshots, drop AI-crafted nudges, and replay the wins that keep motivation saturating your day.",
    icon: "messageSquare",
    highlight: "Boost",
    accent: "from-fuchsia-400/45 via-violet-500/25 to-transparent",
  },
];

const progressPillars = [
  "Micro dopamine check-ins",
  "Intentional rest planning",
  "Reward pacing guardrails",
  "Coach-approved ritual stacking",
];

const progressMeters = [
  {
    label: "Streak energy",
    value: "🔥 21 days",
    percent: 84,
    accent: "from-orange-400/50 to-red-500/40",
  },
  {
    label: "Deep focus minutes",
    value: "312 this week",
    percent: 62,
    accent: "from-cyan-400/50 to-sky-500/40",
  },
  {
    label: "Rewards triggered",
    value: "7 cinematic drops",
    percent: 90,
    accent: "from-fuchsia-400/45 to-violet-500/35",
  },
];

const testimonials = [
  {
    quote: "WhyLearn turned our cohort into streak addicts – the loops are healthy, purposeful, and so fun.",
    name: "Aisha R.",
    role: "Product designer",
  },
  {
    quote: "My students show up because the reward reveal makes progress feel tangible every single day.",
    name: "Mateo G.",
    role: "Bootcamp mentor",
  },
  {
    quote: "The coaching timeline keeps dopamine aligned with real growth. We celebrate data, not noise.",
    name: "Priya K.",
    role: "Independent consultant",
  },
];

const faqs = [
  {
    question: "Is there a free tier?",
    answer:
      "Yes. Jump into the Preview tier to craft plans, test loops, and feel the reward system before upgrading.",
  },
  {
    question: "Does WhyLearn actually email those streak boosts?",
    answer:
      "Absolutely. Every password reset and notification routes through your SMTP setup so you stay in control.",
  },
  {
    question: "How opinionated is the AI coaching?",
    answer:
      "We serve prompts and reflective nudges. You approve, tweak, or dismiss – the system adapts to your taste.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col bg-slate-950 text-slate-50">
      <HeroSection />
      <section id="features" className="relative overflow-hidden border-y border-white/10 py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0f172a,transparent_70%)]" />
        <div className="container flex flex-col gap-12">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <span className="inline-flex w-fit items-center gap-2 self-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 md:self-start">
              Loops engineered for flow
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Dopamine-positive learning without the burnout
            </h2>
            <p className="max-w-2xl text-balance text-slate-300">
              WhyLearn choreographs your planning, execution, and celebrations so motivation compounds. The result: fewer stalls, more streaks, and rituals you crave showing up for.
            </p>
          </div>
          <FeatureShowcase features={features} />
        </div>
      </section>

      <section id="progress" className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,#1e293b,transparent_75%)]" />
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Progress reactor
            </span>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
              Turn rituals into measurable, shareable wins
            </h2>
            <p className="text-slate-300">
              Every update you log powers streak intelligence, gratitude prompts, and reward cinematics. The loop makes it easy to stay obsessed with meaningful effort.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {progressPillars.map((pillar) => (
                <li
                  key={pillar}
                  className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-slate-200 shadow-[0_18px_40px_-30px_rgba(59,130,246,0.7)]"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                  <span>{pillar}</span>
                </li>
              ))}
            </ul>
          </div>
          <ProgressConsole />
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0f172a,transparent_70%)]" />
        <div className="container flex flex-col gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              Trusted serotonin
            </span>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
              Makers falling in love with the loop
            </h2>
            <p className="max-w-2xl text-balance text-slate-300">
              Independent pros, mentors, and multi-player cohorts are using WhyLearn to stay obsessed with compounding growth. The praise hits different when it’s built on data.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-left shadow-[0_28px_120px_-80px_rgba(14,165,233,0.7)]"
              >
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_70%)] opacity-70" />
                <p className="text-sm text-slate-200">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-5 flex flex-col">
                  <span className="text-sm font-semibold text-slate-50">{item.name}</span>
                  <span className="text-xs text-slate-400">{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,#111827,transparent_70%)]" />
        <div className="container grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              FAQ
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">Answers before you chase the streak</h2>
            <p className="text-slate-300">
              Still curious about pricing, SMTP configuration, or the coaching brain? Ping us – transparency fuels our build loop.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-left shadow-[0_18px_70px_-60px_rgba(56,189,248,0.65)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-100">
                  {faq.question}
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 transition-transform group-open:rotate-90">
                    Open
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#0b1120,transparent_75%)]" />
        <div className="container flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/40 bg-rose-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-200">
            Ready for the rush?
          </span>
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
            Spin up your WhyLearn workspace and keep the momentum humming
          </h2>
          <p className="max-w-2xl text-balance text-slate-300">
            Start free, invite collaborators when you are ready, and wire up SMTP so every reset and reward hits instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-6 py-6 text-base font-semibold text-slate-950 shadow-[0_22px_45px_-18px_rgba(56,189,248,0.6)] hover:translate-y-[-2px]"
            >
              <Link href="/auth/signup">
                Create a free workspace
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border border-white/20 bg-transparent px-6 py-6 text-base text-slate-100"
            >
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#111827,transparent_70%)]" />
        <div className="absolute left-[-15%] top-[-10%] h-[420px] w-[420px] rounded-full bg-cyan-500/30 blur-[120px]" />
        <div className="absolute right-[-20%] top-[20%] h-[520px] w-[520px] rounded-full bg-violet-500/25 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-[-40%] h-[420px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22),transparent_70%)]" />
      </div>
      <div className="container relative flex flex-col items-center gap-12 py-24 text-center md:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-slate-200">
          <Stars className="h-4 w-4" aria-hidden="true" />
          Flowstate 2.0 beta
        </span>
        <div className="flex flex-col gap-6">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            The addictive learning OS that rewards deliberate practice
          </h1>
          <p className="mx-auto max-w-2xl text-balance text-sm text-slate-300 sm:text-lg">
            WhyLearn blends coaching intelligence, streak psychology, and cinematic rewards so you build a momentum loop you crave – and keep shipping new skills.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-6 py-6 text-base font-semibold text-slate-950 shadow-[0_22px_45px_-18px_rgba(56,189,248,0.65)] hover:translate-y-[-2px]"
          >
            <Link href="/auth/signup">
              Start your plan
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border border-white/25 bg-transparent px-6 py-6 text-base text-slate-100"
          >
            <Link href="/docs">View documentation</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {heroStats.map((stat) => (
            <HeroStat key={stat.label} {...stat} />
          ))}
        </div>
        <div className="grid w-full gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_32px_120px_-80px_rgba(14,165,233,0.7)] md:grid-cols-[0.8fr_1.2fr] md:text-left">
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              <Flame className="h-4 w-4 text-rose-300" aria-hidden="true" />
              Live dopamine loop
            </span>
            <p className="text-sm text-slate-200">
              Learners are claiming rewards every <strong className="text-slate-50">42 seconds</strong>. Configure your SMTP settings to deliver every reset, nudge, and celebration instantly.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "SMTP native",
              "Coach nudges",
              "Energy-preserving breaks",
            ].map((chip) => (
              <span
                key={chip}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
  meta,
  accent,
}: (typeof heroStats)[number]) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5">
      <div
        className={`pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br ${accent} blur-xl opacity-80`}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/80">
        {label}
      </span>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
      <p className="text-xs text-slate-300/80">{meta}</p>
    </div>
  );
}

function ProgressConsole() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_140px_-80px_rgba(59,130,246,0.7)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#1e293b,transparent_70%)] opacity-80" />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Momentum console</h3>
          <p className="text-xs text-slate-400">Preview of the live progress pulse</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200">
          Preview
        </span>
      </header>
      <div className="mt-6 space-y-5">
        {progressMeters.map((meter) => (
          <SparkMeter key={meter.label} {...meter} />
        ))}
      </div>
    </div>
  );
}

function SparkMeter({
  label,
  value,
  percent,
  accent,
}: (typeof progressMeters)[number]) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span className="font-semibold text-slate-50">{value}</span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${accent}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
