import { NextRequest } from "next/server";
import { handleApiError, ok, fail } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function money(amount: unknown, currency = "GHS") {
  return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
}

function serializeAddress(address?: { name: string; phone: string; addressLine1: string; city: string; region?: string | null } | null) {
  if (!address) return null;
  return {
    name: address.name,
    phone: address.phone,
    addressLine1: address.addressLine1,
    city: address.city,
    region: address.region,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Unauthorized");
    const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { client: true } });
    if (!user) return fail(401, "Unauthorized");

    const payment = await prisma.paymentIntent.findUnique({
      where: { id: (await params).id },
      include: {
        client: true,
        financeEntry: true,
        order: {
          include: {
            senderAddress: true,
            receiverAddress: true,
            items: true,
            rider: true,
            trackingEvents: { orderBy: { happenedAt: "asc" } },
            convertedImageOrder: { include: { images: true } },
          },
        },
      },
    });

    if (!payment) return fail(404, "Payment not found");

    const phone = user.phone ?? user.client?.phone;
    const clientId = user.clientId ?? session.clientId;
    const canView = payment.clientId === clientId
      || payment.order?.clientId === clientId
      || payment.order?.senderAddress.phone === phone
      || payment.order?.receiverAddress.phone === phone;
    if (!canView) return fail(403, "Payment receipt is not available for this account");

    const order = payment.order;
    const images = order?.convertedImageOrder?.images ?? [];
    const items = order?.items ?? [];
    const itemSummary = items.length
      ? items.map((item) => ({ name: item.name, quantity: item.quantity }))
      : [{ name: order?.description?.split(".")[0] || "Package", quantity: images.length || 1 }];

    return ok({
      id: payment.id,
      reference: payment.reference,
      providerReference: payment.providerReference,
      status: payment.status,
      provider: payment.provider,
      channel: payment.channel,
      gatewayResponse: payment.gatewayResponse,
      amount: Number(payment.amount),
      fees: Number(payment.fees),
      currency: payment.currency,
      amountFormatted: money(payment.amount, payment.currency),
      feesFormatted: money(payment.fees, payment.currency),
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      client: payment.client ? {
        businessName: payment.client.businessName,
        contactName: payment.client.contactName,
        phone: payment.client.phone,
        email: payment.client.email,
      } : null,
      order: order ? {
        id: order.id,
        waybill: order.waybill,
        trackingCode: order.trackingCode,
        status: order.status,
        deliveryType: order.deliveryType,
        city: order.city,
        description: order.description,
        amountToCollect: Number(order.amountToCollect),
        amountCollected: Number(order.amountCollected),
        weightKg: Number(order.weightKg),
        itemValue: Number(order.itemValue),
        createdAt: order.createdAt.toISOString(),
        deliveredAt: order.deliveredAt?.toISOString() ?? null,
        senderAddress: serializeAddress(order.senderAddress),
        receiverAddress: serializeAddress(order.receiverAddress),
        rider: order.rider ? { name: order.rider.name, phone: order.rider.phone } : null,
        items: itemSummary,
        images: images.map((image) => ({ id: image.id, url: image.url, fileName: image.fileName, contentType: image.contentType })),
        trackingEvents: order.trackingEvents.map((event) => ({
          id: event.id,
          status: event.status,
          location: event.location,
          note: event.note,
          happenedAt: event.happenedAt.toISOString(),
        })),
      } : null,
      smartIdentification: {
        imageCount: images.length,
        identifiedItems: itemSummary.map((item) => item.name),
        confidence: images.length || items.length ? "Order data + uploaded package images" : "Order data only",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
