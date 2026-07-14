import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

type TrackingEventRow = {
  id: string;
  status: string;
  happenedAt: Date;
};

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
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/client/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-text-muted shadow-sm hover:text-brand"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase text-brand">Sankofa Express</p>
            <h1 className="text-lg font-black text-text sm:text-xl">Tracking {order.trackingCode}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6">
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
            {(order.trackingEvents as TrackingEventRow[]).map((event: TrackingEventRow) => (
              <div key={event.id} className="rounded-md bg-slate-50 p-3">
                <strong>{event.status.replaceAll("_", " ")}</strong>
                <p className="text-sm text-text-muted">{formatDate(event.happenedAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
