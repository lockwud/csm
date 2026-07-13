import type { UserRole } from "@prisma/client";

export function homeForRole(role: UserRole) {
  if (role === "CLIENT") return "/client/dashboard";
  if (role === "RIDER") return "/rider/dashboard";
  return "/dashboard";
}
