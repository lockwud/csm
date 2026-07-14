import Link from "next/link";
import { CheckCircle2, Clock3, MapPin, PackageCheck, Phone, Route } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type RiderOrderRow = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  senderAddress: { name: string; city: string; addressLine1: string };
  receiverAddress: { name: string; phone: string; city: string; addressLine1: string };
  client: { businessName: string } | null;
};

export default async function RiderOrdersPage() {
  const user = await requireUser();
  const orders = user?.riderId ? await prisma.order.findMany({
    where: { riderId: user.riderId },
    include: { senderAddress: true, receiverAddress: true, client: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  }) : [];
  const riderOrders = orders as RiderOrderRow[];
  const active = riderOrders.filter((order: RiderOrderRow) => !["DELIVERED", "FAILED", "CANCELLED", "RETURNED"].includes(order.status));
  const delivered = riderOrders.filter((order: RiderOrderRow) => order.status === "DELIVERED");
  const picked = riderOrders.filter((order: RiderOrderRow) => order.status === "PICKED_UP");
  const outForDelivery = riderOrders.filter((order: RiderOrderRow) => order.status === "OUT_FOR_DELIVERY");

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">Assigned Orders</h1>
        <p className="mt-1 text-sm text-text-muted">Pickup, recipient, location, and confirmation details for rider deliveries.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Assigned Orders" value={riderOrders.length} icon={<PackageCheck className="h-5 w-5" />} details={[
          { label: "Active", value: active.length },
          { label: "Picked", value: picked.length },
          { label: "Out", value: outForDelivery.length },
        ]} />
        <StatCard title="Route Queue" value={active.length} icon={<Route className="h-5 w-5" />} details={[
          { label: "Pickup", value: riderOrders.filter((order: RiderOrderRow) => order.status === "PENDING").length },
          { label: "Transit", value: riderOrders.filter((order: RiderOrderRow) => order.status === "IN_TRANSIT").length },
          { label: "Failed", value: riderOrders.filter((order: RiderOrderRow) => order.status === "FAILED").length },
        ]} />
        <StatCard title="Delivered" value={delivered.length} icon={<CheckCircle2 className="h-5 w-5" />} details={[
          { label: "Done", value: delivered.length },
          { label: "Returned", value: riderOrders.filter((order: RiderOrderRow) => order.status === "RETURNED").length },
          { label: "Cancelled", value: riderOrders.filter((order: RiderOrderRow) => order.status === "CANCELLED").length },
        ]} />
      </section>

      <Card>
        <CardHeader><CardTitle>Delivery Assignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <THead>
                <TR>
                  <TH>Waybill</TH>
                  <TH>Pickup</TH>
                  <TH>Recipient</TH>
                  <TH>Destination</TH>
                  <TH>Status</TH>
                  <TH>Track</TH>
                </TR>
              </THead>
              <TBody>
                {riderOrders.map((order: RiderOrderRow) => (
                  <TR key={order.id}>
                    <TD>
                      <p className="font-black text-brand">{order.waybill}</p>
                      <p className="text-xs text-text-muted">{order.client?.businessName ?? order.senderAddress.name}</p>
                    </TD>
                    <TD>
                      <p>{order.senderAddress.city}</p>
                      <p className="text-xs text-text-muted">{order.senderAddress.addressLine1}</p>
                    </TD>
                    <TD>
                      <p className="font-bold">{order.receiverAddress.name}</p>
                      <a href={`tel:${order.receiverAddress.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand"><Phone className="h-3.5 w-3.5" /> {order.receiverAddress.phone}</a>
                    </TD>
                    <TD>{order.receiverAddress.city}</TD>
                    <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                    <TD><Link href={`/track/${order.trackingCode}`} className="text-sm font-bold text-brand">Open</Link></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {riderOrders.map((order: RiderOrderRow) => (
              <article key={order.id} className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-brand">{order.waybill}</p>
                    <p className="text-xs text-text-muted">{order.client?.businessName ?? order.senderAddress.name}</p>
                  </div>
                  <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <p className="inline-flex items-start gap-2 text-text-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> Pickup: {order.senderAddress.addressLine1}, {order.senderAddress.city}</p>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="font-bold">{order.receiverAddress.name}</p>
                    <a href={`tel:${order.receiverAddress.phone}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-brand"><Phone className="h-3.5 w-3.5" /> {order.receiverAddress.phone}</a>
                    <p className="mt-1 text-text-muted">{order.receiverAddress.addressLine1}, {order.receiverAddress.city}</p>
                  </div>
                  <Link href={`/track/${order.trackingCode}`} className="inline-flex items-center gap-2 text-sm font-bold text-brand"><Clock3 className="h-4 w-4" /> Track order</Link>
                </div>
              </article>
            ))}
          </div>
          {!riderOrders.length ? <p className="p-6 text-sm text-text-muted">No assigned orders yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
