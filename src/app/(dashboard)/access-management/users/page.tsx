import { prisma } from "@/lib/prisma";
import { UsersDirectoryClient } from "./UsersDirectoryClient";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { profile: true, client: true, rider: true },
  });

  return <UsersDirectoryClient initialUsers={users.map((user) => ({
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
