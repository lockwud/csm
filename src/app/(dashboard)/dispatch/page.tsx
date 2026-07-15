import { prisma } from "@/lib/prisma";
import { DispatchClient } from "./DispatchClient";

type DispatchManifestRow = {
  id: string;
  code: string;
  zone: string;
  status: string;
  createdAt: Date;
  rider: { name: string } | null;
  _count?: { stops: number };
};

type PendingOrderRow = {
  id: string;
  waybill: string;
  trackingCode: string;
  deliveryType: string;
  city: string;
  status: string;
  createdAt: Date;
  senderAddress: { city: string; name: string };
  receiverAddress: { city: string; name: string };
};

export default async function DispatchPage() {
  const [manifests, pendingOrders, riders] = await Promise.all([
    prisma.dispatchManifest.findMany({
      include: { rider: true, _count: { select: { stops: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.findMany({
      where: {
        status: "PENDING",
        dispatchStops: { none: {} },
      },
      include: { senderAddress: true, receiverAddress: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.rider.findMany({
      where: {
        status: { in: ["ACTIVE", "ON_DELIVERY"] },
        orders: { none: { status: { in: ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } } },
      },
      select: { id: true, name: true, zone: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DispatchClient
      initialManifests={(manifests as DispatchManifestRow[]).map((manifest: DispatchManifestRow) => ({
        id: manifest.id,
        code: manifest.code,
        zone: manifest.zone,
        status: manifest.status,
        createdAt: manifest.createdAt.toISOString(),
        rider: manifest.rider ? { name: manifest.rider.name } : null,
        _count: manifest._count,
      }))}
      pendingOrders={(pendingOrders as PendingOrderRow[]).map((order: PendingOrderRow) => ({
        id: order.id,
        waybill: order.waybill,
        trackingCode: order.trackingCode,
        deliveryType: order.deliveryType,
        city: order.city,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        senderAddress: { city: order.senderAddress.city, name: order.senderAddress.name },
        receiverAddress: { city: order.receiverAddress.city, name: order.receiverAddress.name },
      }))}
      riders={riders}
    />
  );
}
