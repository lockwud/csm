"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type RiderRecord = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: string;
  vehicleType: string;
  completedToday: number;
  users: Array<{
    id: string;
    email: string;
    profile?: { preferences?: unknown } | null;
  }>;
};

function asPrefs(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function verificationFor(rider: RiderRecord) {
  const prefs = asPrefs(rider.users[0]?.profile?.preferences);
  return String(prefs.verificationStatus ?? (rider.status === "ACTIVE" ? "APPROVED" : "PENDING_REVIEW"));
}

function verificationFromStatus(status: "ACTIVE" | "OFFLINE" | "SUSPENDED", current: string) {
  if (status === "ACTIVE") return "APPROVED";
  if (status === "SUSPENDED") return "SUSPENDED";
  return current || "PENDING_REVIEW";
}

function withVerificationStatus(rider: RiderRecord, status: "ACTIVE" | "OFFLINE" | "SUSPENDED"): RiderRecord {
  const currentVerification = verificationFor(rider);
  const nextVerification = verificationFromStatus(status, currentVerification);
  return {
    ...rider,
    status,
    users: rider.users.map((user, index) => {
      if (index !== 0) return user;
      const currentPrefs = asPrefs(user.profile?.preferences);
      return {
        ...user,
        profile: {
          ...user.profile,
          preferences: {
            ...currentPrefs,
            verificationStatus: nextVerification,
            reviewedAt: new Date().toISOString(),
          },
        },
      };
    }),
  };
}

function vehicleDetails(rider: RiderRecord) {
  const prefs = asPrefs(rider.users[0]?.profile?.preferences);
  return asPrefs(prefs.vehicle);
}

function emergencyContact(rider: RiderRecord) {
  const prefs = asPrefs(rider.users[0]?.profile?.preferences);
  return asPrefs(prefs.emergencyContact);
}

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "destructive" as const;
  return "warning" as const;
}

export function RidersAdminClient({ initialRiders }: { initialRiders: RiderRecord[] }) {
  const [riders, setRiders] = useState(initialRiders);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function setStatus(rider: RiderRecord, status: "ACTIVE" | "OFFLINE" | "SUSPENDED") {
    setSavingId(rider.id);
    const response = await fetch(`/api/riders/${rider.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSavingId(null);
    if (!response.ok) return;
    const result = await response.json();
    if (result.ok) {
      setRiders((items) => items.map((item) => item.id === rider.id ? withVerificationStatus(item, status) : item));
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Rider Verification</h1>
        <p className="text-sm text-text-muted">Review rider onboarding details, approve riders, or turn them off so they cannot receive delivery assignments.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {riders.map((rider) => {
          const vehicle = vehicleDetails(rider);
          const emergency = emergencyContact(rider);
          const verification = verificationFor(rider);
          const isApproved = rider.status === "ACTIVE" && verification === "APPROVED";
          const isOffline = rider.status === "OFFLINE";
          const isSuspended = rider.status === "SUSPENDED";
          return (
            <article key={rider.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{rider.name}</h2>
                  <p className="text-sm text-text-muted">{rider.phone} · {rider.zone} · {rider.vehicleType.replaceAll("_", " ")}</p>
                  <p className="text-sm text-text-muted">{rider.users[0]?.email ?? "No linked user email"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={statusVariant(rider.status)}>{rider.status.replaceAll("_", " ")}</Badge>
                  <Badge variant={verification === "APPROVED" ? "success" : verification === "SUSPENDED" ? "destructive" : "warning"}>{verification.replaceAll("_", " ")}</Badge>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-bold">Identity</p>
                  <p className="mt-1 text-text-muted">ID: {String(asPrefs(rider.users[0]?.profile?.preferences).idNumber ?? "Not submitted")}</p>
                  <p className="text-text-muted">License: {String(asPrefs(rider.users[0]?.profile?.preferences).riderLicenseNumber ?? "Not submitted")}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-bold">Vehicle</p>
                  <p className="mt-1 text-text-muted">Reg: {String(vehicle.registrationNumber ?? "Not submitted")}</p>
                  <p className="text-text-muted">Plate: {String(vehicle.licensePlate ?? "Not submitted")}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-bold">Roadworthy</p>
                  <p className="mt-1 text-text-muted">{String(vehicle.vehicleLicenseNumber ?? "Not submitted")}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="font-bold">Emergency Contact</p>
                  <p className="mt-1 text-text-muted">{String(emergency.name ?? "Not submitted")} · {String(emergency.phone ?? "")}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isApproved ? "secondary" : "default"}
                  disabled={isApproved || savingId === rider.id}
                  loading={savingId === rider.id}
                  onClick={() => setStatus(rider, "ACTIVE")}
                >
                  {isApproved ? "Approved" : "Approve"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isOffline || savingId === rider.id}
                  loading={savingId === rider.id}
                  onClick={() => setStatus(rider, "OFFLINE")}
                >
                  {isOffline ? "Turned Off" : "Turn Off"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isSuspended ? "secondary" : "destructive"}
                  disabled={isSuspended || savingId === rider.id}
                  loading={savingId === rider.id}
                  onClick={() => setStatus(rider, "SUSPENDED")}
                >
                  {isSuspended ? "Suspended" : "Suspend"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
