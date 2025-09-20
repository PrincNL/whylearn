"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordSchema } from "@/app/auth/passwordSchema";
import { resolveApiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const confirmSchema = z.object({
  token: z.string().uuid("Paste the reset link token"),
  password: passwordSchema,
});

type RequestValues = z.infer<typeof requestSchema>;
type ConfirmValues = z.infer<typeof confirmSchema>;
type SubmitState = "idle" | "loading" | "success" | "error";
type ResetStage = "request" | "confirm";

export default function ResetPage() {
  const searchParams = useSearchParams();
  const prefilledToken = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [activeStage, setActiveStage] = useState<ResetStage>(
    prefilledToken ? "confirm" : "request",
  );
  const [requestState, setRequestState] = useState<SubmitState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<SubmitState>("idle");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    reset: resetRequest,
    formState: { errors: requestErrors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const {
    register: registerConfirm,
    handleSubmit: handleConfirmSubmit,
    reset: resetConfirm,
    formState: { errors: confirmErrors },
  } = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      token: prefilledToken,
      password: "",
    },
  });

  useEffect(() => {
    if (!prefilledToken) {
      return;
    }
    resetConfirm({ token: prefilledToken, password: "" });
    setActiveStage("confirm");
  }, [prefilledToken, resetConfirm]);

  const handleRequest = async (values: RequestValues) => {
    setActiveStage("request");
    setRequestState("loading");
    setRequestMessage(null);
    try {
      const response = await fetch(resolveApiUrl("/api/auth/reset/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.message ?? payload?.error ?? "Reset request failed";
        throw new Error(detail);
      }
      setRequestState("success");
      setRequestMessage(
        "If the email exists, a reset link is racing to your inbox. It expires in 30 minutes.",
      );
      setActiveStage("confirm");
      resetRequest();
    } catch (error) {
      setRequestState("error");
      setRequestMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  const handleConfirm = async (values: ConfirmValues) => {
    setActiveStage("confirm");
    setConfirmState("loading");
    setConfirmMessage(null);
    try {
      const response = await fetch(resolveApiUrl("/api/auth/reset/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.message ?? payload?.error ?? "Reset failed";
        throw new Error(detail);
      }
      setConfirmState("success");
      setConfirmMessage("Password updated. Sign in with your new credentials and keep the streak going.");
      resetConfirm({ token: "", password: "" });
    } catch (error) {
      setConfirmState("error");
      setConfirmMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  return (
    <div className="relative isolate overflow-hidden py-20">
      <BackgroundGlow />
      <div className="container relative z-10">
        <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Account recovery lounge
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Ignite a fresh WhyLearn session
          </h1>
          <p className="max-w-2xl text-balance text-sm text-slate-300 sm:text-base">
            Drop your email, catch the reset spark, and lock in a new password. The flow is frictionless so you can get back to compounding progress without missing a beat.
          </p>
        </header>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ResetCard
            stage="request"
            step={1}
            title="Send the reset spark"
            description="We’ll email a secure link so you can reboot your credentials."
            accent="from-cyan-400/60 via-sky-500/30 to-transparent"
            active={activeStage === "request"}
            onActivate={() => setActiveStage("request")}
          >
            <form
              noValidate
              className="space-y-5"
              onSubmit={handleRequestSubmit(handleRequest)}
              onFocusCapture={() => setActiveStage("request")}
            >
              <FormField
                id="reset-email"
                label="Email"
                description="We only use this to send the reset link."
                error={requestErrors.email?.message}
              >
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...registerRequest("email")}
                />
              </FormField>
              <FormMessage state={requestState} message={requestMessage} />
              <Button
                type="submit"
                disabled={requestState === "loading"}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 py-6 text-base font-semibold text-slate-950 shadow-[0_22px_45px_-18px_rgba(56,189,248,0.65)] transition-transform hover:translate-y-[-2px] hover:shadow-[0_30px_80px_-40px_rgba(56,189,248,0.7)]"
              >
                {requestState === "loading" ? "Sending magic..." : "Email me the reset link"}
              </Button>
            </form>
          </ResetCard>

          <div className="flex flex-col gap-6">
            <ResetCard
              stage="confirm"
              step={2}
              title="Lock in a new password"
              description="Paste the token from your inbox and set credentials you love."
              accent="from-fuchsia-500/60 via-violet-500/30 to-transparent"
              active={activeStage === "confirm"}
              onActivate={() => setActiveStage("confirm")}
            >
              <form
                noValidate
                className="space-y-5"
                onSubmit={handleConfirmSubmit(handleConfirm)}
                onFocusCapture={() => setActiveStage("confirm")}
              >
                <FormField
                  id="reset-token"
                  label="Reset token"
                  description="You’ll find this inside the email we just sent."
                  error={confirmErrors.token?.message}
                >
                  <Input
                    id="reset-token"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    autoComplete="off"
                    {...registerConfirm("token")}
                  />
                </FormField>
                <FormField
                  id="reset-password"
                  label="New password"
                  description="Keep it strong – at least 8 characters with variety."
                  error={confirmErrors.password?.message}
                >
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a future-proof passphrase"
                    {...registerConfirm("password")}
                  />
                </FormField>
                <FormMessage state={confirmState} message={confirmMessage} />
                <Button
                  type="submit"
                  disabled={confirmState === "loading"}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-500 py-6 text-base font-semibold text-slate-950 shadow-[0_22px_45px_-18px_rgba(139,92,246,0.58)] transition-transform hover:translate-y-[-2px] hover:shadow-[0_30px_80px_-40px_rgba(168,85,247,0.65)]"
                >
                  {confirmState === "loading" ? "Locking it in..." : "Save new password"}
                </Button>
              </form>
            </ResetCard>

            <MomentumPanel
              stage={activeStage}
              requestState={requestState}
              confirmState={confirmState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  description,
  error,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id} className="text-sm font-medium text-slate-100">
          {label}
        </Label>
        {description ? (
          <span className="text-xs text-slate-400">{description}</span>
        ) : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-rose-300">{error}</p> : null}
    </div>
  );
}

function FormMessage({ state, message }: { state: SubmitState; message: string | null }) {
  if (!message) {
    return null;
  }
  const tone =
    state === "error"
      ? "bg-rose-500/10 text-rose-200 border border-rose-400/40"
      : "bg-cyan-400/10 text-cyan-200 border border-cyan-300/40";
  return (
    <p
      className={cn(
        "rounded-xl px-3 py-2 text-sm shadow-inner backdrop-blur transition-colors",
        tone,
      )}
      aria-live="polite"
    >
      {message}
    </p>
  );
}

function ResetCard({
  stage,
  step,
  title,
  description,
  accent,
  active,
  children,
  onActivate,
}: {
  stage: ResetStage;
  step: number;
  title: string;
  description: string;
  accent: string;
  active: boolean;
  children: React.ReactNode;
  onActivate: () => void;
}) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-left shadow-[0_40px_120px_-60px_rgba(14,165,233,0.65)] backdrop-blur transition-all duration-500",
        active ? "ring-1 ring-cyan-400/50" : "hover:-translate-y-1",
      )}
      onClick={() => onActivate?.()}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-px -z-10 rounded-[1.6rem] bg-gradient-to-br blur-xl transition-opacity duration-700",
          accent,
          active ? "opacity-80" : "opacity-0 group-hover:opacity-50",
        )}
        aria-hidden="true"
      />
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
          Step {step}
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              stage === "confirm" ? "bg-fuchsia-300" : "bg-cyan-300",
            )}
          />
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <p className="text-sm text-slate-300/90">{description}</p>
        </div>
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MomentumPanel({
  stage,
  requestState,
  confirmState,
}: {
  stage: ResetStage;
  requestState: SubmitState;
  confirmState: SubmitState;
}) {
  const highlights = [
    {
      label: "Momentum",
      value:
        confirmState === "success"
          ? "Unlocked"
          : stage === "confirm"
            ? "Link sent"
            : "Priming",
      accent:
        confirmState === "success"
          ? "from-emerald-400/40 to-teal-500/40"
          : "from-cyan-400/30 to-sky-500/20",
    },
    {
      label: "Secure streak",
      value: confirmState === "success" ? "+30 day boost" : "Guarding access",
      accent: "from-violet-400/30 to-fuchsia-500/20",
    },
    {
      label: "Reset energy",
      value: requestState === "success" ? "Inbox buzzing" : "Ready to launch",
      accent: "from-blue-400/30 to-indigo-500/30",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-[0_32px_100px_-80px_rgba(59,130,246,0.7)] backdrop-blur">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_70%)] opacity-80"
        aria-hidden="true"
      />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Recovery pulse</h3>
          <p className="text-xs text-slate-400">
            Watch how fast you’re closing the loop.
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/50 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Dopamine loop
        </span>
      </header>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 text-left",
              "shadow-[0_12px_40px_-28px_rgba(59,130,246,0.8)]",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br blur-lg",
                item.accent,
              )}
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200/70">
              {item.label}
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-100">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BackgroundGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f172a,#020617)]" />
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="absolute right-[-10%] top-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-[110px]" />
      <div className="absolute inset-x-0 bottom-[-40%] h-[420px] bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18),transparent_70%)]" />
    </div>
  );
}
