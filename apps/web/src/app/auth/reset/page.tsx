'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const confirmSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type RequestValues = z.infer<typeof requestSchema>;
type ConfirmValues = z.infer<typeof confirmSchema>;

type SubmitState = "idle" | "loading" | "success" | "error";

export default function ResetPage() {
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
    defaultValues: { token: "", password: "" },
  });

  const [requestState, setRequestState] = useState<SubmitState>("idle");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<SubmitState>("idle");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const handleRequest = async (values: RequestValues) => {
    setRequestState("loading");
    setRequestMessage(null);
    try {
      const response = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = payload?.message ?? payload?.error ?? "Reset request failed";
        throw new Error(detail);
      }
      const data = await response.json().catch(() => ({}));
      setRequestState("success");
      if (data?.data?.resetToken) {
        setRequestMessage(`Reset link sent. Token for testing: ${data.data.resetToken}`);
      } else {
        setRequestMessage("If the email exists we have sent a reset link.");
      }
      resetRequest();
    } catch (error) {
      setRequestState("error");
      setRequestMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  const handleConfirm = async (values: ConfirmValues) => {
    setConfirmState("loading");
    setConfirmMessage(null);
    try {
      const response = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = payload?.message ?? payload?.error ?? "Reset failed";
        throw new Error(detail);
      }
      setConfirmState("success");
      setConfirmMessage("Password updated. You can now sign in with the new credentials.");
      resetConfirm();
    } catch (error) {
      setConfirmState("error");
      setConfirmMessage(error instanceof Error ? error.message : "Unable to reach the server");
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Request a reset link and confirm it once you receive the token in your inbox.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">1. Request reset link</h2>
        <form onSubmit={handleRequestSubmit(handleRequest)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" autoComplete="email" {...registerRequest("email")} />
            {requestErrors.email ? <p className="text-xs text-destructive">{requestErrors.email.message}</p> : null}
          </div>
          {requestMessage ? (
            <p className={`text-sm ${requestState === "error" ? "text-destructive" : "text-primary"}`} aria-live="polite">
              {requestMessage}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={requestState === "loading"}>
            {requestState === "loading" ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </section>

      <hr className="border-border/60" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">2. Confirm new password</h2>
        <form onSubmit={handleConfirmSubmit(handleConfirm)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="reset-token">Reset token</Label>
            <Input id="reset-token" placeholder="Paste the token from your email" {...registerConfirm("token")} />
            {confirmErrors.token ? <p className="text-xs text-destructive">{confirmErrors.token.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input id="reset-password" type="password" autoComplete="new-password" {...registerConfirm("password")} />
            {confirmErrors.password ? <p className="text-xs text-destructive">{confirmErrors.password.message}</p> : null}
          </div>
          {confirmMessage ? (
            <p className={`text-sm ${confirmState === "error" ? "text-destructive" : "text-primary"}`} aria-live="polite">
              {confirmMessage}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={confirmState === "loading"}>
            {confirmState === "loading" ? "Updating..." : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  );
}

