import { MapPin, PackageCheck, Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function RiderOrdersPage() {
  const user = await requireUser();
  const orders = user?.riderId ? await prisma.order.findMany({
    where: { riderId: user.riderId },
    include: { senderAddress: true, receiverAddress: true, client: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  }) : [];
  const active = orders.filter((order) => !["DELIVERED", "FAILED", "CANCELLED", "RETURNED"].includes(order.status));

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">Assigned Orders</h1>
        <p className="mt-1 text-sm text-text-muted">Pickup, recipient, location, and confirmation details for rider deliveries.</p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-text-muted">Assigned</p><strong className="text-2xl">{orders.length}</strong></Card>
        <Card className="p-4"><p className="text-xs text-text-muted">Active</p><strong className="text-2xl">{active.length}</strong></Card>
        <Card className="p-4"><p className="text-xs text-text-muted">Delivered</p><strong className="text-2xl">{orders.filter((order) => order.status === "DELIVERED").length}</strong></Card>
      </section>

      <div className="grid gap-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_150px] lg:items-center">
              <div>
                <p className="font-black text-brand">{order.waybill}</p>
                <p className="mt-2 text-sm text-text-muted">{order.client?.businessName ?? order.senderAddress.name}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-text-muted"><MapPin className="h-4 w-4" /> Pickup: {order.senderAddress.addressLine1}, {order.senderAddress.city}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-bold">{order.receiverAddress.name}</p>
                <a href={`tel:${order.receiverAddress.phone}`} className="mt-1 inline-flex items-center gap-1 text-brand"><Phone className="h-3.5 w-3.5" /> {order.receiverAddress.phone}</a>
                <p className="mt-1 text-text-muted">{order.receiverAddress.addressLine1}, {order.receiverAddress.city}</p>
              </div>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand">
                <PackageCheck className="h-3.5 w-3.5" />
                {order.status.replaceAll("_", " ")}
              </span>
            </div>
          </article>
        ))}
        {!orders.length ? <Card className="p-6 text-sm text-text-muted">No assigned orders yet.</Card> : null}
      </div>
    </div>
  );
}
