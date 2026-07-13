"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ClipboardCheck, Mail, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

type AccountType = "CLIENT" | "RIDER";

const vehicleOptions = [
  { label: "Motorbike", value: "MOTORBIKE" },
  { label: "Saloon car", value: "SALOON" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Van", value: "VAN" },
  { label: "Truck", value: "TRUCK" },
];

const clientPurposeOptions = [
  { label: "Send packages", value: "SEND" },
  { label: "Receive packages", value: "RECEIVE" },
  { label: "Send and receive", value: "BOTH" },
];

function toOptions(values: string[], fallback: string[]) {
  return (values.length ? values : fallback).map((value) => ({ label: value, value }));
}

function SoftSelect({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
}) {
  const [selected, setSelected] = useState(options[0]?.value ?? "");
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? "Select option";

  return (
    <label className="grid gap-1.5 text-sm font-medium text-text">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <input type="hidden" name={name} value={selected} required={required} />
      <details className="group relative">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-xl border border-border bg-slate-50 px-3 text-sm font-semibold text-text outline-none transition hover:bg-white group-open:border-brand group-open:ring-2 group-open:ring-brand/15">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-border bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                setSelected(option.value);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className={selected === option.value ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-2.5 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}
            >
              <Check className={selected === option.value ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              {option.label}
            </button>
          ))}
        </div>
      </details>
    </label>
  );
}

export function RegisterForm({
  initialRole = "CLIENT",
  pickupAreas,
  packageTypes,
}: {
  initialRole?: AccountType;
  pickupAreas: string[];
  packageTypes: string[];
}) {
  const role = initialRole;
  const [submitting, setSubmitting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [pendingRegistration, setPendingRegistration] = useState<Record<string, string> | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" | "info" } | null>(null);
  const pickupAreaOptions = toOptions(pickupAreas, ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"]);
  const packageTypeOptions = toOptions(packageTypes, ["Documents", "Parcel", "Food", "Electronics", "Boxes"]);
  const steps = role === "CLIENT"
    ? [
        { title: "Account details", body: "Login, contact, and delivery communication." },
        { title: "Client profile", body: "Sender or receiver identity, service area, and package type." },
        { title: "Start booking", body: "Create, receive, and track deliveries from your dashboard." },
      ]
    : [
        { title: "Account details", body: "Login, contact, and dispatch communication." },
        { title: "Rider verification", body: "Identity, address, zone, and license details." },
        { title: "Vehicle details", body: "Registration, plate, roadworthy, and vehicle type." },
        { title: "Safety contact", body: "Emergency contact and review consent." },
      ];

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!resendAfter) return;
    const interval = window.setInterval(() => {
      setResendAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [resendAfter]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const formValues = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));

    if (!pendingRegistration) {
      setToast({
        title: "Sending verification",
        message: "Sending a one-time code to your email before creating the account.",
        variant: "info",
      });
      const sent = await requestEmailOtp(String(formValues.email ?? ""), String(formValues.name ?? ""));
      setSubmitting(false);
      if (!sent) return;
      setPendingRegistration(formValues);
      setOtpSent(true);
      setToast({ title: "Verification sent", message: "Enter the 6-digit code sent to your email.", variant: "success" });
      return;
    }

    setToast({
      title: role === "RIDER" ? "Submitting application" : "Creating account",
      message: "Verifying your email and saving your onboarding details.",
      variant: "info",
    });

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pendingRegistration, emailOtp: formValues.emailOtp }),
    }).catch(() => null);

    if (!response) {
      setSubmitting(false);
      setToast({ title: "Submission failed", message: "Connection is unavailable. Please try again.", variant: "error" });
      return;
    }

    const result = await response.json().catch(() => null) as { ok?: boolean; data?: { redirectTo?: string }; error?: string } | null;
    if (!response.ok || !result?.ok) {
      setSubmitting(false);
      setToast({ title: "Submission failed", message: result?.error ?? "Please check the form and try again.", variant: "error" });
      return;
    }

    setToast({
      title: role === "RIDER" ? "Application submitted" : "Account created",
      message: role === "RIDER" ? "Your rider profile is ready for admin verification." : "Opening your client dashboard.",
      variant: "success",
    });
    window.setTimeout(() => {
      window.location.href = result.data?.redirectTo ?? (role === "RIDER" ? "/rider/dashboard" : "/client/dashboard");
    }, 900);
  }

  async function requestEmailOtp(email: string, name: string) {
    if (!email) {
      setToast({ title: "Email required", message: "Enter your email address before requesting a code.", variant: "error" });
      return false;
    }

    setSendingOtp(true);
    setToast({ title: "Sending verification", message: "Sending a one-time code to your email.", variant: "info" });
    const response = await fetch("/api/auth/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    }).catch(() => null);

    setSendingOtp(false);
    if (!response?.ok) {
      const result = await response?.json().catch(() => null) as { error?: string } | null;
      const wait = result?.error?.match(/wait (\d+) seconds/)?.[1];
      if (wait) setResendAfter(Number(wait));
      setToast({ title: "Code not sent", message: result?.error ?? "Unable to send the verification email right now.", variant: "error" });
      return false;
    }
    setOtpSent(true);
    setResendAfter(60);
    return true;
  }

  async function sendEmailOtp() {
    const form = document.getElementById("onboarding-form") as HTMLFormElement | null;
    const formData = form ? new FormData(form) : null;
    const email = pendingRegistration?.email ?? String(formData?.get("email") ?? "");
    const name = pendingRegistration?.name ?? String(formData?.get("name") ?? "");
    const sent = await requestEmailOtp(email, name);
    if (sent) setToast({ title: "Verification sent", message: "Check your inbox and enter the 6-digit code.", variant: "success" });
  }

  return (
    <form id="onboarding-form" onSubmit={submit} className="grid min-h-0 flex-1 lg:grid-cols-[330px_minmax(0,1fr)]">
      {toast ? (
        <div className="fixed right-5 top-5 z-[260] w-[min(360px,calc(100vw-40px))]">
          <Toast title={toast.title} message={toast.message} variant={toast.variant} />
        </div>
      ) : null}
      {submitting ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-white/85 px-6 backdrop-blur-md">
          <div className="grid justify-items-center text-center">
            <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-full bg-slate-100">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
              <span className="absolute inset-2 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
              <PackageCheck className="relative h-8 w-8 text-brand" />
            </div>
            <h2 className="text-lg font-black text-text">{role === "RIDER" ? "Submitting rider application" : "Creating client account"}</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
              Saving your onboarding details and preparing the right workspace.
            </p>
          </div>
        </div>
      ) : null}
      <input type="hidden" name="role" value={role} />

      <aside className="hidden min-h-0 lg:block">
        <div className="flex h-full flex-col bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur">
          <Link href="/login" className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-text-muted transition hover:bg-brand-light hover:text-brand" aria-label="Back to login">
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="mb-5 flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-light text-brand">
              {role === "RIDER" ? <Truck className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-black uppercase text-brand">{role === "RIDER" ? "Rider application" : "Client onboarding"}</p>
              {role === "RIDER" ? (
                <>
                  <h2 className="mt-1 text-lg font-black text-text">Verification process</h2>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    Dispatch reviews rider identity, vehicle details, and emergency contact before enabling live delivery assignments.
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={step.title} className="grid grid-cols-[32px_1fr] gap-3 rounded-xl bg-slate-50 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black text-brand shadow-sm">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-black text-text">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-xl bg-brand-light p-4 text-sm leading-6 text-brand">
            {role === "RIDER"
              ? "Rider accounts start offline until verification is reviewed. After approval, dispatch can assign delivery orders and route details."
              : "After signup, you can send packages, receive deliveries, choose payment points, and follow rider progress from your client dashboard."}
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col overflow-hidden bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="shrink-0 border-b border-border bg-white/90 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <Link href="/login" className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-text-muted transition hover:bg-brand-light hover:text-brand lg:hidden" aria-label="Back to login">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
              <p className="text-xs font-black uppercase text-brand">{role === "RIDER" ? "Rider application" : "Client registration"}</p>
              <h2 className="text-lg font-black text-text">{role === "RIDER" ? "Complete your rider profile" : "Complete your client profile"}</h2>
              <p className="mt-1 hidden max-w-2xl text-xs leading-5 text-text-muted sm:block">
                {role === "RIDER"
                  ? "Submit your verification details so dispatch can review and approve your rider access."
                  : "Create your sender or receiver profile and start managing deliveries from your client dashboard."}
              </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand">
              {steps.length} stages
            </span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((step, index) => (
              <div key={step.title}>
                <div className="h-1.5 rounded-full bg-brand" />
                <p className="mt-2 truncate text-[11px] font-bold text-text-muted">{index + 1}. {step.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5">
          {pendingRegistration ? (
            <section className="mx-auto grid w-full max-w-2xl gap-5 rounded-xl border border-border bg-white/95 p-8 text-center shadow-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-light text-brand">
                <Mail className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-brand">Email verification</p>
                <h2 className="mt-2 text-2xl font-black text-text">Enter the code we sent</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
                  We sent a 6-digit code to <strong className="text-text">{pendingRegistration.email}</strong>. Verify it to finish creating your {role === "RIDER" ? "rider" : "client"} account.
                </p>
              </div>
              <Input
                label="Verification Code"
                name="emailOtp"
                inputMode="numeric"
                maxLength={6}
                required
                helperText="The code expires after 10 minutes."
                className="h-12 text-center text-lg font-black tracking-[0.35em]"
              />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button type="button" variant="secondary" loading={sendingOtp} disabled={resendAfter > 0} leftIcon={<Mail className="h-4 w-4" />} onClick={sendEmailOtp}>
                  {resendAfter > 0 ? `Resend in ${resendAfter}s` : otpSent ? "Resend code" : "Send code"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPendingRegistration(null)}>
                  Edit details
                </Button>
              </div>
            </section>
          ) : (
            <>
          <section className="grid gap-4 rounded-xl border border-border bg-white/95 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-black text-white">1</span>
            <div>
              <h2 className="text-sm font-black text-text">Account Details</h2>
              <p className="text-xs text-text-muted">These details are used for login and delivery contact.</p>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Input label="Full Name" name="name" required />
            <Input label="Phone Number" name="phone" type="tel" required />
            <Input label="Email Address" name="email" type="email" required />
            <Input label="Password" name="password" type="password" required minLength={8} helperText="Use at least 8 characters." />
          </div>
        </section>

        {role === "CLIENT" ? (
          <section className="grid gap-4 rounded-xl border border-border bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-black text-white">2</span>
              <div>
                <h2 className="text-sm font-black text-text">Client Profile</h2>
                <p className="text-xs text-text-muted">Tell us how to identify the sender or receiver account.</p>
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Input label="Business, Sender, or Receiver Name" name="businessName" required={role === "CLIENT"} />
              <Input label="Contact Person" name="contactName" />
              <SoftSelect label="Client Purpose" name="clientPurpose" options={clientPurposeOptions} />
              <SoftSelect label="Pickup or Receiving Area" name="pickupArea" options={pickupAreaOptions} />
              <SoftSelect label="Main Package Type" name="mainPackageType" options={packageTypeOptions} />
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 rounded-xl border border-border bg-white/95 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-black text-white">2</span>
                <div>
                  <h2 className="text-sm font-black text-text">Rider Verification</h2>
                  <p className="text-xs text-text-muted">We review these details before approving live dispatch access.</p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <Input label="Residential Address" name="address" required={role === "RIDER"} />
                <SoftSelect label="Delivery Zone" name="zone" options={pickupAreaOptions} required={role === "RIDER"} />
                <Input
                  label="Ghana Card or ID Number"
                  name="idNumber"
                  required={role === "RIDER"}
                  placeholder="GHA-123456789-1"
                  pattern="GHA-[0-9]{9}-[0-9]"
                  maxLength={15}
                  autoCapitalize="characters"
                  helperText="Use the Ghana Card / ECOWAS ID PIN format: GHA-123456789-1."
                  title="Enter a valid Ghana Card / ECOWAS ID number, for example GHA-123456789-1"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.toUpperCase();
                  }}
                />
                <Input
                  label="Rider or Driver License Number"
                  name="riderLicenseNumber"
                  required={role === "RIDER"}
                  placeholder="D123456789"
                  pattern="[A-Z]{1,3}[- ]?[0-9]{6,10}([- ]?[A-Z0-9])?"
                  maxLength={16}
                  autoCapitalize="characters"
                  helperText="Use your Ghana DVLA rider/driver licence number, for example D123456789."
                  title="Enter a valid Ghana rider or driver license number, for example D123456789"
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value.toUpperCase();
                  }}
                />
                <Input label="Years of Riding or Driving" name="yearsExperience" type="number" min={0} required={role === "RIDER"} />
                <Input label="Preferred Operating Area" name="preferredArea" placeholder="Osu, Ridge, Spintex" />
              </div>
            </section>

            <section className="grid gap-4 rounded-xl border border-border bg-white/95 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-black text-white">3</span>
                <div>
                  <h2 className="text-sm font-black text-text">Vehicle Details</h2>
                  <p className="text-xs text-text-muted">Dispatch uses this to match the right rider and route.</p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <SoftSelect label="Vehicle Type" name="vehicleType" options={vehicleOptions} />
                <Input label="Vehicle Registration Number" name="registrationNumber" required={role === "RIDER"} />
                <Input label="License Plate" name="licensePlate" required={role === "RIDER"} />
                <Input label="Vehicle License or Roadworthy Number" name="vehicleLicenseNumber" required={role === "RIDER"} />
              </div>
            </section>

            <section className="grid gap-4 rounded-xl border border-border bg-white/95 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-xs font-black text-white">4</span>
                <div>
                  <h2 className="text-sm font-black text-text">Emergency Contact</h2>
                  <p className="text-xs text-text-muted">Used only for rider safety and verification follow-up.</p>
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <Input label="Contact Name" name="emergencyName" required={role === "RIDER"} />
                <Input label="Contact Phone" name="emergencyPhone" type="tel" required={role === "RIDER"} />
                <Input label="Relationship" name="emergencyRelationship" placeholder="Sibling, spouse" required={role === "RIDER"} />
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-text-muted">
                <input type="checkbox" name="verificationConsent" value="yes" required={role === "RIDER"} className="mt-1 h-4 w-4 rounded border-border accent-brand" />
                I confirm these rider and vehicle details are accurate and can be reviewed for verification.
              </label>
            </section>
          </>
        )}
            </>
          )}

        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-white/95 px-5 py-4">
          <p className="hidden text-xs leading-5 text-text-muted sm:block">
            {pendingRegistration
              ? "Enter the code from your email to finish account creation."
              : "We will send an email code before creating the account."}
          </p>
          <Button type="submit" size="default" loading={submitting} className="ml-auto px-5" leftIcon={role === "RIDER" ? <ShieldCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}>
            {pendingRegistration
              ? role === "RIDER" ? "Verify & Submit Application" : "Verify & Create Account"
              : role === "RIDER" ? "Send Code" : "Create Account"}
          </Button>
        </div>
      </div>
    </form>
  );
}
