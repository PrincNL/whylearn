'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const paceSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine(
    (value) => value === undefined || (Number.isInteger(value) && value > 0 && value <= 40),
    { message: "Enter hours between 1 and 40" },
  );

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  goal: z.string().min(3, "Describe what you want to achieve"),
  preferredPaceHoursPerWeek: paceSchema,
});

type FormValues = z.infer<typeof schema>;

type SubmitState = "idle" | "loading" | "success" | "error";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const highlight = useMemo(() => {
    if (!requestedPlan) {
      return null;
    }
    if (requestedPlan.toLowerCase() === "pro") {
      return "You selected the Pro plan. We will tailor rewards and analytics accordingly.";
    }
    if (requestedPlan.toLowerCase() === "elite") {
      return "Elite plan selected. Our team will follow up with onboarding details.";
    }
    return `Plan preference: ${requestedPlan}`;
  }, [requestedPlan]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      goal: "",
      preferredPaceHoursPerWeek: undefined,
    },
  });

  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = payload?.message ?? payload?.error ?? "Registration failed";
        throw new Error(detail);
      }
      setState("success");
      setMessage("Account created! Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.href = "/app/dashboard";
      }, 900);
      reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Create your workspace</h1>
        <p className="text-sm text-muted-foreground">We will generate a personalised learning plan in seconds.</p>
      </header>
      {highlight ? <p className="rounded-md bg-primary/10 p-3 text-sm text-primary">{highlight}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
          <p className="text-xs text-muted-foreground">Use at least 8 characters with a mix of numbers or symbols.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">What would you like to achieve?</Label>
          <Input id="goal" placeholder="e.g. Launch a UX design cohort" {...register("goal")} />
          {errors.goal ? <p className="text-xs text-destructive">{errors.goal.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace">Preferred hours per week (optional)</Label>
          <Input id="pace" type="number" min={1} max={40} placeholder="6" {...register("preferredPaceHoursPerWeek")} />
          {errors.preferredPaceHoursPerWeek ? (
            <p className="text-xs text-destructive">{errors.preferredPaceHoursPerWeek.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Helps us tailor milestone reminders.</p>
          )}
        </div>
        {message ? (
          <p className={`text-sm ${state === "error" ? "text-destructive" : "text-primary"}`} aria-live="polite">{message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={state === "loading"}>
          {state === "loading" ? "Creating workspace..." : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}

