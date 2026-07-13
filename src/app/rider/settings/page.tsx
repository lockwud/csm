import { redirect } from "next/navigation";
import { PortalSettings } from "@/components/portal/PortalSettings";
import { requireUser } from "@/lib/auth/session";

export default async function RiderSettingsPage() {
  const user = await requireUser();
  if (!user || user.role !== "RIDER") redirect("/login");
  return (
    <PortalSettings
      portal="rider"
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rider: user.rider ? {
          name: user.rider.name,
          phone: user.rider.phone,
          zone: user.rider.zone,
          status: user.rider.status,
          vehicleType: user.rider.vehicleType,
        } : null,
        profile: user.profile ? { preferences: user.profile.preferences } : null,
      }}
    />
  );
}
