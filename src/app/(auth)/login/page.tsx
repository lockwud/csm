import Link from "next/link";
import { Bike, UserPlus } from "lucide-react";
import { AuthVisual } from "../AuthVisual";
import { SignInForm } from "../SignInForm";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen">
      <AuthVisual />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 text-center">
            <p className="text-xs font-black uppercase text-brand">Client and Rider Access</p>
            <h1 className="mt-2 text-3xl font-black text-text">Welcome back</h1>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              A courier management system for booking deliveries, assigning riders, tracking parcels, managing payments, and keeping customers updated from pickup to proof of delivery.
            </p>
          </div>

          <SignInForm audience="PUBLIC" buttonLabel="Sign in" initialSplash />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/register" className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm font-bold text-text shadow-sm hover:border-brand-light hover:text-brand">
              <UserPlus className="h-5 w-5 text-brand" />
              Create client account
            </Link>
            <Link href="/register?type=rider" className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 text-sm font-bold text-text shadow-sm hover:border-brand-light hover:text-brand">
              <Bike className="h-5 w-5 text-brand" />
              Apply as rider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
