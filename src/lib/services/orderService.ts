import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/response";
import { nextReference } from "@/lib/services/referenceService";
import { quoteDelivery } from "@/lib/services/pricingService";
import { trackingCode } from "@/lib/utils/generateWaybill";
import type { z } from "zod";
import type { orderSchema } from "@/lib/api/validators/cms";

export async function listOrders(params: { page?: number; pageSize?: number; q?: string; status?: OrderStatus | null; city?: string | null }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const where: Prisma.OrderWhereInput = {
    status: params.status ?? undefined,
    city: params.city ?? undefined,
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
  const quote = await quoteDelivery({
    city: input.city,
    deliveryType: input.deliveryType,
    distanceKm: input.distanceKm,
    weightKg: input.weightKg,
    codAmount: input.itemValue,
  });
  const paymentBy = input.paymentBy ?? "Sender";
  const senderShare = paymentBy === "Split" ? Math.min(90, Math.max(10, Number(input.senderSharePercent ?? 50))) : paymentBy === "Sender" ? 100 : 0;
  const receiverShare = 100 - senderShare;
  const amountToCollect = paymentBy === "Recipient"
    ? quote.deliveryFee
    : paymentBy === "Split"
      ? Number((quote.deliveryFee * receiverShare / 100).toFixed(2))
      : Number(input.amountToCollect ?? 0);
  const confirmationCode = input.confirmationCode ?? `CNF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const description = [
    input.description,
    `Delivery fee GHS ${quote.deliveryFee.toFixed(2)}`,
    `Payment ${paymentBy}${paymentBy === "Split" ? ` (${senderShare}/${receiverShare})` : ""}`,
    input.paymentMethod ? `Method ${input.paymentMethod}` : null,
    `Confirmation ${confirmationCode}`,
    input.imageOrderId ? `Image order ${input.imageOrderId}` : null,
  ].filter(Boolean).join(". ");

  return prisma.order.create({
    data: {
      waybill: await nextReference("Waybill Number"),
      trackingCode: await nextReference("Tracking Code").catch(() => trackingCode()),
      deliveryType: input.deliveryType,
      city: input.city,
      description,
      amountToCollect,
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
          note: `Order created. ${quote.zoneName ? `Zone ${quote.zoneName}. ` : ""}Confirmation ${confirmationCode}.`,
        },
      },
      convertedImageOrder: input.imageOrderId ? { connect: { id: input.imageOrderId } } : undefined,
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

function confirmationFromOrder(description?: string | null) {
  return description?.match(/Confirmation ([A-Z0-9-]+)/)?.[1];
}

export async function updateOrderStatus(id: string, status: OrderStatus, input?: { location?: string; note?: string; confirmationCode?: string }) {
  if (status === "DELIVERED") {
    const order = await prisma.order.findUnique({ where: { id }, select: { description: true } });
    const expected = confirmationFromOrder(order?.description);
    if (expected && input?.confirmationCode?.trim().toUpperCase() !== expected.toUpperCase()) {
      throw new ApiError(422, "Receiver confirmation code does not match this order");
    }
  }

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
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider || rider.status !== "ACTIVE") {
    throw new Error("Rider must be approved and active before receiving orders");
  }

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
