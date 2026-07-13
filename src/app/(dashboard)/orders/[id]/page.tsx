import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getOrder } from "@/lib/services/orderService";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/dateHelpers";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold">{order.waybill}</h1><p className="text-sm text-text-muted">{order.trackingCode}</p></div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Shipment</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          <div><p className="text-sm text-text-muted">Sender</p><strong>{order.senderAddress.name}</strong><p>{order.senderAddress.addressLine1}, {order.senderAddress.city}</p></div>
          <div><p className="text-sm text-text-muted">Recipient</p><strong>{order.receiverAddress.name}</strong><p>{order.receiverAddress.addressLine1}, {order.receiverAddress.city}</p></div>
          <div><p className="text-sm text-text-muted">Status</p><Badge variant="info">{order.status.replaceAll("_", " ")}</Badge></div>
          <div><p className="text-sm text-text-muted">COD</p><strong>{formatCurrency(String(order.amountToCollect))}</strong></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Tracking</CardTitle></CardHeader><CardContent className="grid gap-3">
          {order.trackingEvents.map((event) => <div key={event.id} className="rounded-md bg-slate-50 p-3"><strong className="text-sm">{event.status.replaceAll("_", " ")}</strong><p className="text-xs text-text-muted">{formatDate(event.happenedAt)} · {event.location ?? "No location"}</p><p className="text-sm">{event.note}</p></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
