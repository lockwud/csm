import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@/lib/types/prismaEnums";
import { UsersDirectoryClient } from "./UsersDirectoryClient";

type UserDirectoryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  profile: { jobTitle: string | null } | null;
  client: { businessName: string } | null;
  rider: { zone: string } | null;
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { profile: true, client: true, rider: true },
  });

  return <UsersDirectoryClient initialUsers={(users as UserDirectoryRow[]).map((user: UserDirectoryRow) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    profile: user.profile ? { jobTitle: user.profile.jobTitle } : null,
    client: user.client ? { businessName: user.client.businessName } : null,
    rider: user.rider ? { zone: user.rider.zone } : null,
  }))} />;
}
