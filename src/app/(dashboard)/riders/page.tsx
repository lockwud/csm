import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export default async function RidersPage() {
  const riders = await prisma.rider.findMany({ orderBy: { name: "asc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Riders</h1><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{riders.map((rider) => <Card key={rider.id}><CardHeader><CardTitle>{rider.name}</CardTitle></CardHeader><CardContent><Badge variant={rider.status === "ACTIVE" ? "success" : "warning"}>{rider.status.replaceAll("_", " ")}</Badge><p className="mt-3 text-sm text-text-muted">{rider.phone} · {rider.zone}</p><p className="text-sm">Today: {rider.completedToday} deliveries</p></CardContent></Card>)}</div></div>;
}
