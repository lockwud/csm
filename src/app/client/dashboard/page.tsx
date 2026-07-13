import Link from "next/link";
import { CircleDollarSign, Clock3, Headphones, MapPin, Navigation, PackageCheck, Truck } from "lucide-react";
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
            <p className="mt-1 text-sm text-text-muted">Shows the assigned rider location for the active package.</p>
          </div>
          {trackedOrder ? <Link href={`/track/${trackedOrder.trackingCode}`} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-dark">Open Tracking</Link> : null}
        </div>
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-h-[340px] overflow-hidden bg-slate-100">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#cbd5e1_1px,transparent_1px),linear-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />
            <div className="absolute left-[18%] top-[62%] grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-lg ring-4 ring-brand-light">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div className="absolute right-[20%] top-[24%] grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-lg ring-4 ring-brand-light">
              <Navigation className="h-6 w-6" />
            </div>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M20 66 C35 48 55 52 78 30" fill="none" stroke="#0b57d0" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-4 py-3 text-sm shadow-sm">
              <p className="font-bold">{liveLocation ? "Live rider location active" : "Waiting for rider live location"}</p>
              <p className="text-text-muted">{liveLocation ? `${liveLocation.latitude.toFixed(5)}, ${liveLocation.longitude.toFixed(5)}` : "Rider location appears after the rider updates it from the rider portal."}</p>
            </div>
          </div>
          <aside className="border-t border-border bg-white p-4 lg:border-l lg:border-t-0">
            {trackedOrder ? (
              <div>
                <p className="text-xs font-black uppercase text-brand">Tracking package</p>
                <Link href={`/track/${trackedOrder.trackingCode}`} className="mt-1 block text-lg font-black text-brand">{trackedOrder.waybill}</Link>
                <p className="mt-2 text-sm text-text-muted">{trackedOrder.senderAddress.name} to {trackedOrder.receiverAddress.name}</p>
                <p className="text-sm text-text-muted">{trackedOrder.receiverAddress.addressLine1}, {trackedOrder.receiverAddress.city}</p>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-bold">Status</p>
                  <p className="text-text-muted">{trackedOrder.status.replaceAll("_", " ")}</p>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-bold">Rider</p>
                  <p className="text-text-muted">{trackedOrder.rider?.name ?? "Not assigned yet"}</p>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-brand" /> Current Location</p>
                  <p className="mt-1 text-text-muted">{liveLocation ? `${liveLocation.latitude.toFixed(5)}, ${liveLocation.longitude.toFixed(5)}` : "Not available yet"}</p>
                  {liveLocation?.note ? <p className="mt-1 text-xs text-text-muted">{liveLocation.note}</p> : null}
                </div>
              </div>
            ) : <p className="text-sm text-text-muted">No package is available for live tracking yet.</p>}
          </aside>
        </div>
      </Card>
    </div>
  );
}
