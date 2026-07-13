import { notFound } from "next/navigation";
import { LiveRouteMap } from "@/components/maps/LiveRouteMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { trackOrder } from "@/lib/services/orderService";
import { formatDate } from "@/lib/utils/dateHelpers";

function liveLocationValue(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export default async function TrackPage({ params }: { params: Promise<{ trackingCode: string }> }) {
  const { trackingCode } = await params;
  const order = await trackOrder(trackingCode);
  if (!order) notFound();
  const riderLocationSetting = order.riderId ? await prisma.appSetting.findFirst({
    where: { key: "live_location", scope: "RIDER", riderId: order.riderId },
    orderBy: { updatedAt: "desc" },
  }) : null;
  const liveLocation = liveLocationValue(riderLocationSetting?.value);

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-bold">Tracking {order.trackingCode}</h1>
      <LiveRouteMap
        title={`Live Tracking ${order.waybill}`}
        status={order.status}
        riderName={order.rider?.name}
        riderLocation={liveLocation}
        pickup={order.senderAddress}
        destination={order.receiverAddress}
        fallbackCity={order.city}
      />
      <Card>
        <CardHeader><CardTitle>{order.status.replaceAll("_", " ")}</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {order.trackingEvents.map((event) => (
            <div key={event.id} className="rounded-md bg-slate-50 p-3">
              <strong>{event.status.replaceAll("_", " ")}</strong>
              <p className="text-sm text-text-muted">{formatDate(event.happenedAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
