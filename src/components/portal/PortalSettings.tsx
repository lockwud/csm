"use client";

import { useState } from "react";
import { Save, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";

type PortalSettingsUser = {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  client?: { businessName: string; contactName: string; phone: string; email?: string | null } | null;
  rider?: { name: string; phone: string; zone: string; status: string; vehicleType: string } | null;
  profile?: { preferences?: unknown } | null;
};

export function PortalSettings({ user, portal }: { user: PortalSettingsUser; portal: "client" | "rider" }) {
  const [toast, setToast] = useState<{ title: string; message: string; variant: "success" | "error" | "info" } | null>(null);
  const prefs = typeof user.profile?.preferences === "object" && user.profile?.preferences ? user.profile.preferences as Record<string, unknown> : {};
  const vehicle = typeof prefs.vehicle === "object" && prefs.vehicle ? prefs.vehicle as Record<string, unknown> : {};
  const emergency = typeof prefs.emergencyContact === "object" && prefs.emergencyContact ? prefs.emergencyContact as Record<string, unknown> : {};

  async function changePassword(formData: FormData) {
    setToast({ title: "Updating password", message: "Checking your current password.", variant: "info" });
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
      }),
    });
    setToast(response.ok
      ? { title: "Password changed", message: "Your account password has been updated.", variant: "success" }
      : { title: "Password change failed", message: "Check your current password and try again.", variant: "error" });
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Delete this account? Your historical orders, payments, and tickets will remain for records, but your portal access will be deactivated.");
    if (!confirmed) return;
    setToast({ title: "Deleting account", message: "Deactivating your portal access.", variant: "info" });
    const response = await fetch("/api/auth/delete-account", { method: "POST" });
    if (!response.ok) {
      setToast({ title: "Account deletion failed", message: "Unable to delete your account right now.", variant: "error" });
      return;
    }
    setToast({ title: "Account deleted", message: "Your account has been deactivated.", variant: "success" });
    window.setTimeout(() => {
      window.location.assign("/login");
    }, 800);
  }

  return (
    <div className="grid gap-5">
      {toast ? (
        <div className="fixed right-5 top-5 z-[260] w-[min(360px,calc(100vw-40px))]">
          <Toast title={toast.title} message={toast.message} variant={toast.variant} />
        </div>
      ) : null}
      <div>
        <p className="text-xs font-black uppercase text-brand">{portal === "client" ? "Client Settings" : "Rider Settings"}</p>
        <h1 className="mt-1 text-2xl font-black">Profile & Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your portal profile, account details, and password.</p>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><UserRound className="h-4 w-4 text-brand" /> Account Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Full Name" value={user.name} readOnly />
          <Input label="Email" value={user.email} readOnly />
          <Input label="Phone" value={user.phone ?? user.client?.phone ?? user.rider?.phone ?? ""} readOnly />
          <Input label="Role" value={user.role.replaceAll("_", " ")} readOnly />
        </div>
      </Card>

      {portal === "client" ? (
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Client Preferences</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Business / Sender Name" value={user.client?.businessName ?? ""} readOnly />
            <Input label="Contact Person" value={user.client?.contactName ?? ""} readOnly />
            <Input label="Client Purpose" value={String(prefs.clientPurpose ?? "Send and receive")} readOnly />
            <Input label="Pickup / Receiving Area" value={String(prefs.pickupArea ?? "")} readOnly />
            <Input label="Main Package Type" value={String(prefs.mainPackageType ?? "")} readOnly />
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Rider Verification</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Rider Status" value={user.rider?.status?.replaceAll("_", " ") ?? ""} readOnly />
            <Input label="Verification Status" value={String(prefs.verificationStatus ?? "PENDING_REVIEW")} readOnly />
            <Input label="Delivery Zone" value={user.rider?.zone ?? ""} readOnly />
            <Input label="Vehicle Type" value={String(user.rider?.vehicleType ?? vehicle.type ?? "")} readOnly />
            <Input label="Registration Number" value={String(vehicle.registrationNumber ?? "")} readOnly />
            <Input label="License Plate" value={String(vehicle.licensePlate ?? "")} readOnly />
            <Input label="Emergency Contact" value={String(emergency.name ?? "")} readOnly />
            <Input label="Emergency Phone" value={String(emergency.phone ?? "")} readOnly />
          </div>
        </Card>
      )}

      <Card className="p-5" id="security">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-brand" /> Change Password</h2>
        <form action={changePassword} className="grid gap-4 md:grid-cols-2">
          <Input label="Current Password" name="currentPassword" type="password" required />
          <Input label="New Password" name="newPassword" type="password" required minLength={8} />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>Save Password</Button>
          </div>
        </form>
      </Card>

      <Card className="border-danger/20 p-5">
        <h2 className="mb-2 flex items-center gap-2 font-bold text-danger"><Trash2 className="h-4 w-4" /> Delete Account</h2>
        <p className="text-sm text-text-muted">Deactivate this {portal} account. If you sign up again later with the same verified email, your old account will be reopened.</p>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="destructive" leftIcon={<Trash2 className="h-4 w-4" />} onClick={deleteAccount}>
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
