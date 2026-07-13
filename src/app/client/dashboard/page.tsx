import Link from "next/link";
import { CircleDollarSign, Clock3, Headphones, Truck } from "lucide-react";
import { LiveRouteMap } from "@/components/maps/LiveRouteMap";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";

function liveLocationValue(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    note: typeof record.note === "string" ? record.note : null,
  };
}

export default async function ClientDashboardPage() {
  const user = await requireUser();
  const clientId = user?.clientId;
  const phone = user?.phone ?? user?.client?.phone;
  const orderFilters = [
    clientId ? { clientId } : null,
    phone ? { receiverAddress: { is: { phone } } } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const orders = orderFilters.length ? await prisma.order.findMany({
    where: {
      OR: orderFilters,
    },
    include: { receiverAddress: true, senderAddress: true, rider: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  }) : [];
  const [payments, tickets] = clientId ? await Promise.all([
    prisma.paymentIntent.findMany({ where: { clientId }, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.supportTicket.findMany({ where: { clientId }, orderBy: { updatedAt: "desc" }, take: 80 }),
  ]) : [[], []];
  const activeOrders = orders.filter((order) => ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status));
  const paidAmount = payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingPayments = payments.filter((payment) => ["PENDING", "INITIALIZED", "AUTHORIZED"].includes(payment.status));
  const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const resolvedTickets = tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status));
  const trackedOrder = activeOrders.find((order) => order.riderId) ?? activeOrders[0] ?? orders[0];
  const riderLocationSetting = trackedOrder?.riderId ? await prisma.appSetting.findFirst({
    where: { key: "live_location", scope: "RIDER", riderId: trackedOrder.riderId },
    orderBy: { updatedAt: "desc" },
  }) : null;
  const liveLocation = liveLocationValue(riderLocationSetting?.value);

  return (
    <div className="grid gap-5">
      <div>
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">Track packages, payments, support, and live rider movement.</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Packages" value={orders.length} icon={<Truck className="h-5 w-5" />} details={[
          { label: "Pending", value: orders.filter((order) => order.status === "PENDING").length },
          { label: "Active", value: activeOrders.length },
          { label: "Done", value: orders.filter((order) => order.status === "DELIVERED").length },
        ]} />
        <StatCard title="Active Deliveries" value={activeOrders.length} icon={<Clock3 className="h-5 w-5" />} details={[
          { label: "Picked", value: orders.filter((order) => order.status === "PICKED_UP").length },
          { label: "Transit", value: orders.filter((order) => order.status === "IN_TRANSIT").length },
          { label: "Out", value: orders.filter((order) => order.status === "OUT_FOR_DELIVERY").length },
        ]} />
        <StatCard title="Payment Status" value={`GHS ${paidAmount.toFixed(2)}`} icon={<CircleDollarSign className="h-5 w-5" />} details={[
          { label: "Paid", value: payments.filter((payment) => payment.status === "PAID").length },
          { label: "Pending", value: pendingPayments.length },
          { label: "Failed", value: payments.filter((payment) => payment.status === "FAILED").length },
        ]} />
        <StatCard title="Support Tickets" value={openTickets.length} icon={<Headphones className="h-5 w-5" />} details={[
          { label: "Open", value: openTickets.length },
          { label: "Resolved", value: resolvedTickets.length },
          { label: "Escalated", value: tickets.filter((ticket) => ticket.status === "ESCALATED").length },
        ]} />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-4">
          <div>
            <h2 className="font-bold">Live Order Map</h2>
            <p className="mt-1 text-sm text-text-muted">Shows rider movement, best route, distance, and estimated arrival.</p>
          </div>
          {trackedOrder ? <Link href={`/track/${trackedOrder.trackingCode}`} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-dark">Open Tracking</Link> : null}
        </div>
        {trackedOrder ? (
          <LiveRouteMap
            title={`Tracking ${trackedOrder.waybill}`}
            status={trackedOrder.status}
            riderName={trackedOrder.rider?.name}
            riderLocation={liveLocation}
            pickup={trackedOrder.senderAddress}
            destination={trackedOrder.receiverAddress}
            fallbackCity={trackedOrder.city}
          />
        ) : <p className="p-6 text-sm text-text-muted">No package is available for live tracking yet.</p>}
      </Card>
    </div>
  );
}
