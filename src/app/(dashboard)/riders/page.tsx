import { prisma } from "@/lib/prisma";
import { RidersAdminClient } from "./RidersAdminClient";

export default async function RidersPage() {
  const riders = await prisma.rider.findMany({
    orderBy: { name: "asc" },
    take: 50,
    include: { users: { include: { profile: true } } },
  });
  return <RidersAdminClient initialRiders={riders.map((rider) => ({
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    zone: rider.zone,
    status: rider.status,
    vehicleType: rider.vehicleType,
    completedToday: rider.completedToday,
    users: rider.users.map((user) => ({
      id: user.id,
      email: user.email,
      profile: user.profile ? { preferences: user.profile.preferences } : null,
    })),
  }))} />;
}
