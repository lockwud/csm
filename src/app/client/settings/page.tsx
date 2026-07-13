import { redirect } from "next/navigation";
import { PortalSettings } from "@/components/portal/PortalSettings";
import { requireUser } from "@/lib/auth/session";

export default async function ClientSettingsPage() {
  const user = await requireUser();
  if (!user || user.role !== "CLIENT") redirect("/login");
  return (
    <PortalSettings
      portal="client"
      user={{
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        client: user.client ? {
          businessName: user.client.businessName,
          contactName: user.client.contactName,
          phone: user.client.phone,
          email: user.client.email,
        } : null,
        profile: user.profile ? { preferences: user.profile.preferences } : null,
      }}
    />
  );
}
