import { notFound } from "next/navigation";
import { LiveRouteMap } from "@/components/maps/LiveRouteMap";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { getOrder } from "@/lib/services/orderService";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/dateHelpers";

function liveLocationValue(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

type TrackingEventRow = {
  id: string;
  status: string;
  happenedAt: Date;
  location: string | null;
  note: string | null;
};

type PackageImageRow = {
  id: string;
  url: string;
  fileName: string | null;
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const riderLocationSetting = order.riderId ? await prisma.appSetting.findFirst({
    where: { key: "live_location", scope: "RIDER", riderId: order.riderId },
    orderBy: { updatedAt: "desc" },
  }) : null;
  const liveLocation = liveLocationValue(riderLocationSetting?.value);

  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold">{order.waybill}</h1><p className="text-sm text-text-muted">{order.trackingCode}</p></div>
      <LiveRouteMap
        title="Admin Live Route"
        status={order.status}
        riderName={order.rider?.name}
        riderLocation={liveLocation}
        pickup={order.senderAddress}
        destination={order.receiverAddress}
        fallbackCity={order.city}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Shipment</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
          <div><p className="text-sm text-text-muted">Sender</p><strong>{order.senderAddress.name}</strong><p>{order.senderAddress.addressLine1}, {order.senderAddress.city}</p></div>
          <div><p className="text-sm text-text-muted">Recipient</p><strong>{order.receiverAddress.name}</strong><p>{order.receiverAddress.addressLine1}, {order.receiverAddress.city}</p></div>
          <div><p className="text-sm text-text-muted">Status</p><Badge variant="info">{order.status.replaceAll("_", " ")}</Badge></div>
          <div><p className="text-sm text-text-muted">COD</p><strong>{formatCurrency(String(order.amountToCollect))}</strong></div>
        </CardContent></Card>
        {order.convertedImageOrder?.images.length ? <Card><CardHeader><CardTitle>Package Images</CardTitle></CardHeader><CardContent className="grid gap-3">
          {(order.convertedImageOrder.images as PackageImageRow[]).slice(0, 4).map((image: PackageImageRow) => (
            <div key={image.id} className="overflow-hidden rounded-lg border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.fileName ?? `Package image ${order.waybill}`} className="h-32 w-full object-cover" />
              <p className="truncate px-3 py-2 text-xs font-semibold text-text-muted">{image.fileName ?? "Package image"}</p>
            </div>
          ))}
        </CardContent></Card> : null}
        <Card><CardHeader><CardTitle>Tracking</CardTitle></CardHeader><CardContent className="grid gap-3">
          {(order.trackingEvents as TrackingEventRow[]).map((event: TrackingEventRow) => <div key={event.id} className="rounded-md bg-slate-50 p-3"><strong className="text-sm">{event.status.replaceAll("_", " ")}</strong><p className="text-xs text-text-muted">{formatDate(event.happenedAt)} · {event.location ?? "No location"}</p><p className="text-sm">{event.note}</p></div>)}
        </CardContent></Card>
      </div>
    </div>
  );
}
