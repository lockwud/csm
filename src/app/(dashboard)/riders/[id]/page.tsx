import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

type RiderOrderRow = {
  id: string;
  waybill: string;
  status: string;
};

export default async function RiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rider = await prisma.rider.findUnique({ where: { id }, include: { orders: { take: 10, orderBy: { createdAt: "desc" } } } });
  if (!rider) notFound();
  const orders = rider.orders as RiderOrderRow[];
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">{rider.name}</h1><Card><CardHeader><CardTitle>Assigned Orders</CardTitle></CardHeader><CardContent className="grid gap-2">{orders.map((order: RiderOrderRow) => <p key={order.id} className="rounded-md bg-slate-50 p-3">{order.waybill} · {order.status}</p>)}</CardContent></Card></div>;
}
