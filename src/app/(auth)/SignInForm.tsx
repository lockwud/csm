"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

function AuthSplash({ title = "Preparing sign in", message = "Loading your courier access screen." }: { title?: string; message?: string }) {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-white/85 px-6 backdrop-blur-md">
      <div className="grid justify-items-center text-center">
        <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-full bg-slate-100">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
          <span className="absolute inset-2 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
          <PackageCheck className="relative h-8 w-8 text-brand" />
        </div>
        <h2 className="text-lg font-black text-text">{title}</h2>
        <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">{message}</p>
      </div>
    </div>
  );
}

export function SignInForm({
  audience,
  buttonLabel,
  defaultEmail,
  defaultPassword,
  initialSplash = false,
}: {
  audience: "ADMIN" | "PUBLIC";
  buttonLabel: string;
  defaultEmail?: string;
  defaultPassword?: string;
  initialSplash?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [showInitialSplash, setShowInitialSplash] = useState(initialSplash);
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!initialSplash) return;
    const timeout = window.setTimeout(() => setShowInitialSplash(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [initialSplash]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setToast({ title: "Signing in", message: "Checking your account and workspace access.", variant: "info" });

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        remember: formData.get("remember") === "yes",
      }),
    }).catch(() => null);

    if (!response) {
      setLoading(false);
      setToast({ title: "Sign in failed", message: "Connection is unavailable. Please try again.", variant: "error" });
      return;
    }

    const result = await response.json().catch(() => null) as { ok?: boolean; data?: { redirectTo?: string }; error?: string } | null;
    if (!response.ok || !result?.ok) {
      setLoading(false);
      setToast({ title: "Sign in failed", message: result?.error ?? "Check your email and password.", variant: "error" });
      return;
    }

    setToast({ title: "Sign in successful", message: "Access confirmed. Opening your dashboard.", variant: "success" });
    window.setTimeout(() => {
      window.location.href = result.data?.redirectTo ?? (audience === "ADMIN" ? "/dashboard" : "/client/dashboard");
    }, 900);
  }

  return (
    <>
      {showInitialSplash ? <AuthSplash /> : null}
      {loading ? <AuthSplash title="Signing you in" message="Preparing your courier workspace and checking your access." /> : null}
      {toast ? (
        <div className="fixed right-5 top-5 z-[260] w-[min(360px,calc(100vw-40px))]">
          <Toast title={toast.title} message={toast.message} variant={toast.variant} />
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur"
      >
        <input type="hidden" name="audience" value={audience} />
        <Input label="Email" name="email" type="email" required placeholder="you@example.com" defaultValue={defaultEmail} />
        <Input label="Password" name="password" type="password" required placeholder="Enter your password" defaultValue={defaultPassword} />
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 font-medium text-text-muted">
            <input type="checkbox" name="remember" value="yes" className="h-4 w-4 rounded border-border accent-brand" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-bold text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} rightIcon={<ArrowRight className="h-4 w-4" />}>
          {buttonLabel}
        </Button>
      </form>
    </>
  );
}
