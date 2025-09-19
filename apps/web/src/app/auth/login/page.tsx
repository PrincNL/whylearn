'use client';

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

type SubmitState = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = payload?.message ?? payload?.error ?? "Login failed";
        throw new Error(detail);
      }
      setState("success");
      setMessage("Login successful. Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.href = "/app/dashboard";
      }, 800);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to pick up where you left off.</p>
      </header>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>
        {message ? (
          <p
            className={`text-sm ${state === "error" ? "text-destructive" : "text-primary"}`}
            role={state === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={state === "loading"}>
          {state === "loading" ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="space-y-2 text-center text-sm text-muted-foreground">
        <p>
          No account yet?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p>
          Forgot password?{" "}
          <Link href="/auth/reset" className="text-primary hover:underline">
            Reset it here
          </Link>
        </p>
      </div>
    </div>
  );
}


