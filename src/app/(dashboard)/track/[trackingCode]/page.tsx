import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { trackOrder } from "@/lib/services/orderService";
import { formatDate } from "@/lib/utils/dateHelpers";

export default async function TrackPage({ params }: { params: Promise<{ trackingCode: string }> }) {
  const { trackingCode } = await params;
  const order = await trackOrder(trackingCode);
  if (!order) notFound();
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Tracking {order.trackingCode}</h1><Card><CardHeader><CardTitle>{order.status.replaceAll("_", " ")}</CardTitle></CardHeader><CardContent className="grid gap-3">{order.trackingEvents.map((event) => <div key={event.id} className="rounded-md bg-slate-50 p-3"><strong>{event.status.replaceAll("_", " ")}</strong><p className="text-sm text-text-muted">{formatDate(event.happenedAt)}</p></div>)}</CardContent></Card></div>;
}
