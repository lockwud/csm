"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setToast({ title: "Sending request", message: "Checking the account and notifying support.", variant: "info" });
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(formData.get("email") ?? "") }),
    }).catch(() => null);

    setLoading(false);
    if (!response?.ok) {
      setToast({ title: "Request failed", message: "Unable to submit the reset request right now.", variant: "error" });
      return;
    }

    setToast({ title: "Reset requested", message: "If the account exists, reset support has been notified.", variant: "success" });
  }

  return (
    <>
      {toast ? (
        <div className="fixed right-5 top-5 z-[260] w-[min(360px,calc(100vw-40px))]">
          <Toast title={toast.title} message={toast.message} variant={toast.variant} />
        </div>
      ) : null}
      <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
        <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
        <Button type="submit" size="lg" loading={loading} leftIcon={<Mail className="h-4 w-4" />}>Request reset</Button>
      </form>
    </>
  );
}
