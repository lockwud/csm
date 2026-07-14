import { prisma } from "@/lib/prisma";
import { createNotification, notifyClient, notifyRider } from "@/lib/services/notificationService";
import { nextReference } from "@/lib/services/referenceService";

type DispatchedOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  clientId: string | null;
};

export async function createManifest(input: { zone: string; riderId?: string; orderIds?: string[] }) {
  const orderIds = input.orderIds ?? [];
  const code = await nextReference("Dispatch Manifest");
  let dispatchedOrders: DispatchedOrder[] = [];

  const manifest = await prisma.$transaction(async (tx) => {
    const created = await tx.dispatchManifest.create({
      data: {
        code,
        zone: input.zone,
        riderId: input.riderId,
        capacity: orderIds.length,
        status: orderIds.length ? "READY" : "DRAFT",
        stops: {
          create: orderIds.map((orderId, index) => ({ orderId, sequence: index + 1 })),
        },
      },
      include: { stops: { include: { order: true } }, rider: true },
    });

    if (orderIds.length) {
      dispatchedOrders = await tx.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, waybill: true, trackingCode: true, clientId: true },
      });
      await tx.order.updateMany({
        where: { id: { in: orderIds } },
        data: {
          riderId: input.riderId,
          status: input.riderId ? "OUT_FOR_DELIVERY" : "PENDING",
        },
      });
      await tx.trackingEvent.createMany({
        data: dispatchedOrders.map((order) => ({
          orderId: order.id,
          status: input.riderId ? "OUT_FOR_DELIVERY" : "PENDING",
          location: input.zone,
          note: `Added to dispatch manifest ${created.code}${input.riderId ? " and assigned to rider" : ""}.`,
        })),
      });
    }

    return created;
  });

  if (dispatchedOrders.length) {
    await Promise.all([
      ...dispatchedOrders.map((order) => notifyClient(order.clientId, {
        title: "Order dispatched",
        body: `${order.waybill} has been added to dispatch manifest ${manifest.code}.`,
        type: "DISPATCH",
        href: `/track/${order.trackingCode}`,
        metadata: { orderId: order.id, manifestId: manifest.id },
      })),
      input.riderId ? notifyRider(input.riderId, {
        title: "Dispatch manifest assigned",
        body: `${manifest.code} has ${dispatchedOrders.length} stop${dispatchedOrders.length === 1 ? "" : "s"} assigned to you.`,
        type: "DISPATCH",
        href: "/rider/orders",
        metadata: { manifestId: manifest.id, orderIds },
      }) : createNotification({
        title: "Dispatch manifest created",
        body: `${manifest.code} was created with ${dispatchedOrders.length} stop${dispatchedOrders.length === 1 ? "" : "s"} but no rider.`,
        type: "DISPATCH",
        href: `/dispatch/manifests/${manifest.id}`,
      }),
    ]);
  }

  return manifest;
}
