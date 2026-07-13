import type { UserRole } from "@prisma/client";

export const routePermissions: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/dashboard", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "FINANCE", "SUPPORT"] },
  { prefix: "/orders", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "CLIENT", "RIDER"] },
  { prefix: "/clients", roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "FINANCE"] },
  { prefix: "/dispatch", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER"] },
  { prefix: "/finance", roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
  { prefix: "/image-orders", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT"] },
  { prefix: "/riders", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER"] },
  { prefix: "/settings", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/support", roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
  { prefix: "/rewards", roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
  { prefix: "/reports", roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
  { prefix: "/access-management", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/client", roles: ["SUPER_ADMIN", "ADMIN", "CLIENT"] },
  { prefix: "/rider", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "RIDER"] },
  { prefix: "/profile", roles: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE", "CLIENT", "RIDER"] },
];

export function canAccessPath(role: UserRole, pathname: string) {
  if (role === "SUPER_ADMIN") return true;
  const rule = routePermissions
    .filter((item) => pathname.startsWith(item.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return rule ? rule.roles.includes(role) : true;
}
