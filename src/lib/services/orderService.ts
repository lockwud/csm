import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateWaybill, trackingCode } from "@/lib/utils/generateWaybill";
import type { z } from "zod";
import type { orderSchema } from "@/lib/api/validators/cms";

export async function listOrders(params: { page?: number; pageSize?: number; q?: string; status?: OrderStatus | null }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const where: Prisma.OrderWhereInput = {
    status: params.status ?? undefined,
    OR: params.q
      ? [
          { waybill: { contains: params.q, mode: "insensitive" } },
          { trackingCode: { contains: params.q, mode: "insensitive" } },
          { senderAddress: { name: { contains: params.q, mode: "insensitive" } } },
          { receiverAddress: { name: { contains: params.q, mode: "insensitive" } } },
        ]
      : undefined,
  };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { client: true, rider: true, senderAddress: true, receiverAddress: true },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function createOrder(input: z.infer<typeof orderSchema>) {
  return prisma.order.create({
    data: {
      waybill: generateWaybill(),
      trackingCode: trackingCode(),
      deliveryType: input.deliveryType,
      city: input.city,
      description: input.description,
      amountToCollect: input.amountToCollect,
      weightKg: input.weightKg,
      itemValue: input.itemValue,
      client: input.clientId ? { connect: { id: input.clientId } } : undefined,
      rider: input.riderId ? { connect: { id: input.riderId } } : undefined,
      senderAddress: { create: input.senderAddress },
      receiverAddress: { create: input.receiverAddress },
      items: { create: input.items },
      trackingEvents: {
        create: {
          status: "PENDING",
          location: input.city,
          note: "Order created",
        },
      },
    },
    include: { senderAddress: true, receiverAddress: true, items: true, trackingEvents: true },
  });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      rider: true,
      senderAddress: true,
      receiverAddress: true,
      items: true,
      trackingEvents: { orderBy: { happenedAt: "desc" } },
      financeEntries: true,
      dispatchStops: { include: { manifest: true } },
    },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus, input?: { location?: string; note?: string }) {
  const dateField =
    status === "DELIVERED" ? { deliveredAt: new Date() } : status === "FAILED" ? { failedAt: new Date() } : {};
  return prisma.order.update({
    where: { id },
    data: {
      status,
      ...dateField,
      trackingEvents: {
        create: {
          status,
          location: input?.location,
          note: input?.note ?? `Status changed to ${status.replaceAll("_", " ").toLowerCase()}`,
        },
      },
    },
    include: { trackingEvents: { orderBy: { happenedAt: "desc" } } },
  });
}

export async function assignRider(orderId: string, riderId: string) {
  return prisma.order.update({
    where: { id: orderId },
    data: { riderId, status: "OUT_FOR_DELIVERY" },
    include: { rider: true },
  });
}

export async function trackOrder(trackingCodeValue: string) {
  return prisma.order.findUnique({
    where: { trackingCode: trackingCodeValue },
    include: {
      senderAddress: true,
      receiverAddress: true,
      trackingEvents: { orderBy: { happenedAt: "desc" } },
    },
  });
}
