import { prisma } from "@/lib/prisma";
import { PermissionsClient } from "./PermissionsClient";

export default async function PermissionsPage() {
  const setting = await prisma.appSetting.findFirst({
    where: { key: "role_permissions", scope: "GLOBAL", userId: null, clientId: null, riderId: null },
  });

  return <PermissionsClient initialPermissions={setting?.value} />;
}
