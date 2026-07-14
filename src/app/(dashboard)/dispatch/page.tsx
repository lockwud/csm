import { prisma } from "@/lib/prisma";
import { DispatchClient } from "./DispatchClient";

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
      where: { status: "ACTIVE" },
      select: { id: true, name: true, zone: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DispatchClient
      initialManifests={manifests.map((manifest) => ({
        id: manifest.id,
        code: manifest.code,
        zone: manifest.zone,
        status: manifest.status,
        createdAt: manifest.createdAt.toISOString(),
        rider: manifest.rider ? { name: manifest.rider.name } : null,
        _count: manifest._count,
      }))}
      pendingOrders={pendingOrders.map((order) => ({
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
