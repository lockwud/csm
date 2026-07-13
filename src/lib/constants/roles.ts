import type { UserRole } from "@prisma/client";

export const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "DISPATCHER",
  "SUPPORT",
  "FINANCE",
  "CLIENT",
  "RIDER",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DISPATCHER: "Dispatcher",
  SUPPORT: "Support",
  FINANCE: "Finance",
  CLIENT: "Client",
  RIDER: "Rider",
};
