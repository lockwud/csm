"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setToast({ title: "Sending code", message: "If this email exists, we will send a password reset code.", variant: "info" });
    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") ?? "").trim();
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-otp", email: nextEmail }),
    }).catch(() => null);

    setLoading(false);
    if (!response?.ok) {
      const result = await response?.json().catch(() => null);
      setToast({ title: "Request failed", message: result?.error ?? "Unable to send the reset code right now.", variant: "error" });
      return;
    }

    setEmail(nextEmail);
    setCodeSent(true);
    setToast({ title: "Check your email", message: "Enter the 6-digit code and choose a new password.", variant: "success" });
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setToast({ title: "Resetting password", message: "Verifying your code and updating your password.", variant: "info" });
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setLoading(false);
      setToast({ title: "Passwords do not match", message: "Enter the same new password twice.", variant: "error" });
      return;
    }

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset-password",
        email,
        otp: String(formData.get("otp") ?? "").trim(),
        password,
      }),
    }).catch(() => null);

    setLoading(false);
    if (!response?.ok) {
      const result = await response?.json().catch(() => null);
      setToast({ title: "Reset failed", message: result?.error ?? "Unable to reset your password right now.", variant: "error" });
      return;
    }

    setToast({ title: "Password reset", message: "Your password has been reset. You can now sign in.", variant: "success" });
    window.setTimeout(() => {
      window.location.href = "/login?reset=success";
    }, 900);
  }

  return (
    <>
      {toast ? (
        <div className="fixed right-5 top-5 z-[260] w-[min(360px,calc(100vw-40px))]">
          <Toast title={toast.title} message={toast.message} variant={toast.variant} />
        </div>
      ) : null}
      {!codeSent ? (
        <form onSubmit={requestCode} className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
          <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
          <Button type="submit" size="lg" loading={loading} leftIcon={<Mail className="h-4 w-4" />}>Send reset code</Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="rounded-xl bg-brand-light p-3 text-sm font-semibold text-brand">
            Code sent to {email}. Enter it below to reset your password.
          </div>
          <Input label="Reset code" name="otp" inputMode="numeric" minLength={6} maxLength={6} required placeholder="123456" />
          <Input label="New password" name="password" type="password" minLength={8} required placeholder="At least 8 characters" />
          <Input label="Confirm new password" name="confirmPassword" type="password" minLength={8} required placeholder="Repeat password" />
          <Button type="submit" size="lg" loading={loading} leftIcon={<KeyRound className="h-4 w-4" />}>Reset password</Button>
          <Button type="button" variant="ghost" disabled={loading} onClick={() => setCodeSent(false)}>Use a different email</Button>
        </form>
      )}
    </>
  );
}
