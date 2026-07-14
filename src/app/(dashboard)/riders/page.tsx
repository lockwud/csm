import { prisma } from "@/lib/prisma";
import { RidersAdminClient } from "./RidersAdminClient";

type RiderUserRow = {
  id: string;
  email: string;
  profile: { preferences: unknown } | null;
};

type RiderRow = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: string;
  vehicleType: string;
  completedToday: number;
  users: RiderUserRow[];
};

export default async function RidersPage() {
  const riders = await prisma.rider.findMany({
    orderBy: { name: "asc" },
    take: 50,
    include: { users: { include: { profile: true } } },
  });
  return <RidersAdminClient initialRiders={(riders as RiderRow[]).map((rider: RiderRow) => ({
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    zone: rider.zone,
    status: rider.status,
    vehicleType: rider.vehicleType,
    completedToday: rider.completedToday,
    users: rider.users.map((user: RiderUserRow) => ({
      id: user.id,
      email: user.email,
      profile: user.profile ? { preferences: user.profile.preferences } : null,
    })),
  }))} />;
}
