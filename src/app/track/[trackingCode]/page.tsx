import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { trackOrder } from "@/lib/services/orderService";
import { formatDate } from "@/lib/utils/dateHelpers";
import { TrackingMapInner } from "@/components/tracking/TrackingMapInner";

function liveLocationValue(value: unknown, updatedAt?: Date | null) {
  if (!updatedAt || Date.now() - updatedAt.getTime() > 2 * 60 * 1000) return null;
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

type PackageImageRow = {
  id: string;
  url: string;
  fileName: string | null;
};

type OrderAddressShape = {
  name: string;
  addressLine1: string;
  city: string;
  latitude: unknown;
  longitude: unknown;
};

function plainAddress(address: OrderAddressShape) {
  return {
    name: address.name,
    addressLine1: address.addressLine1,
    city: address.city,
    latitude: address.latitude === null ? null : Number(address.latitude),
    longitude: address.longitude === null ? null : Number(address.longitude),
  };
}

export default async function TrackPage({ params }: { params: Promise<{ trackingCode: string }> }) {
  const { trackingCode } = await params;
  const order = await trackOrder(trackingCode);
  if (!order) notFound();
  const riderLocationSetting = order.riderId ? await prisma.appSetting.findFirst({
    where: { key: "live_location", scope: "RIDER", riderId: order.riderId },
    orderBy: { updatedAt: "desc" },
  }) : null;
  const liveLocation = liveLocationValue(riderLocationSetting?.value, riderLocationSetting?.updatedAt);
  const trackingOrder = {
    waybill: order.waybill,
    status: order.status,
    rider: order.rider ? { name: order.rider.name } : null,
    senderAddress: plainAddress(order.senderAddress),
    receiverAddress: plainAddress(order.receiverAddress),
    city: order.city,
  };

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
        <TrackingMapInner riderId={order.riderId ?? ""} initialLocation={liveLocation} order={trackingOrder} />
        {order.convertedImageOrder?.images.length ? (
          <Card>
            <CardHeader><CardTitle>Package Images</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(order.convertedImageOrder.images as PackageImageRow[]).map((image: PackageImageRow) => (
                  <div key={image.id} className="overflow-hidden rounded-lg border border-border bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.fileName ?? `Package image ${order.waybill}`} className="h-44 w-full object-cover" />
                    <p className="truncate px-3 py-2 text-xs font-semibold text-text-muted">{image.fileName ?? "Package image"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
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
