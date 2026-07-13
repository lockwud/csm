import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/services/orderService";

const processSchema = z.object({
  deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).default("STANDARD"),
  city: z.string().min(2),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(6),
  receiverAddress: z.string().min(3),
  description: z.string().optional(),
  paymentBy: z.enum(["Sender", "Recipient", "Split"]).default("Sender"),
  paymentMethod: z.string().default("Cash"),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const input = processSchema.parse(await request.json().catch(() => ({})));
    const imageOrder = await prisma.imageOrder.findUnique({ where: { id }, include: { images: true, convertedOrder: true, client: true } });
    if (!imageOrder) throw new Error("Image order not found");
    if (imageOrder.convertedOrder) return ok(imageOrder.convertedOrder);

    const order = await createOrder({
      imageOrderId: imageOrder.id,
      clientId: imageOrder.clientId ?? undefined,
      deliveryType: input.deliveryType,
      city: input.city,
      description: input.description ?? `${imageOrder.label}. Converted from ${imageOrder.images.length} uploaded image(s).`,
      amountToCollect: 0,
      weightKg: imageOrder.itemCount,
      itemValue: 0,
      paymentBy: input.paymentBy,
      paymentMethod: input.paymentMethod,
      senderAddress: {
        name: imageOrder.submittedBy,
        phone: imageOrder.senderPhone,
        addressLine1: imageOrder.client?.businessName ?? "Image order pickup",
        city: input.city,
      },
      receiverAddress: {
        name: input.receiverName,
        phone: input.receiverPhone,
        addressLine1: input.receiverAddress,
        city: input.city,
      },
      items: [{ name: imageOrder.label, quantity: Math.max(1, imageOrder.itemCount) }],
    });

    await prisma.imageOrder.update({ where: { id }, data: { status: "PROCESSED", processedAt: new Date(), convertedOrderId: order.id } });
    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
