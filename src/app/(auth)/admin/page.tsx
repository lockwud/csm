import { AuthVisual } from "../AuthVisual";
import { SignInForm } from "../SignInForm";

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen">
      <AuthVisual />
      <section className="relative z-10 grid min-h-screen place-items-center px-5 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase text-brand">Admin Console</p>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Access operations, dispatch, finance, riders, reports, and system configuration.
            </p>
          </div>

          <SignInForm audience="ADMIN" buttonLabel="Sign in to admin" defaultEmail="admin@sankofaexpress.com" defaultPassword="Admin@2026" />
        </div>
      </section>
    </div>
  );
}
