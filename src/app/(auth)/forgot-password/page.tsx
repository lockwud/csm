import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthVisual } from "../AuthVisual";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen">
      <AuthVisual />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 text-center">
            <p className="text-xs font-black uppercase text-brand">Account Recovery</p>
            <h1 className="mt-2 text-3xl font-black text-text">Forgot password?</h1>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Enter your email and the support team will help you reset access after confirming the account.
            </p>
          </div>

          <ForgotPasswordForm />

          <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-brand hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
