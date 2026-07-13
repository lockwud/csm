import { NextRequest } from "next/server";
import crypto from "crypto";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { applyPaystackVerification } from "@/lib/services/paymentService";
import type { PaystackVerifyData } from "@/lib/paystack";

function signatureIsValid(body: string, signature: string | null) {
  if (!process.env.PAYSTACK_SECRET_KEY) return true;
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(body).digest("hex");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const payload = JSON.parse(rawBody);
    if (!signatureIsValid(rawBody, signature)) {
      return fail(401, "Invalid Paystack signature");
    }

    const event = await prisma.paystackWebhookEvent.create({
      data: {
        event: String(payload.event ?? "unknown"),
        reference: payload.data?.reference,
        signature,
        payload,
        processed: false,
      },
    });

    if (payload.event === "charge.success" && payload.data?.reference) {
      const payment = await applyPaystackVerification(payload.data as PaystackVerifyData);
      return ok(await prisma.paystackWebhookEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date(), paymentIntentId: payment?.id },
      }));
    }

    return ok(await prisma.paystackWebhookEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
