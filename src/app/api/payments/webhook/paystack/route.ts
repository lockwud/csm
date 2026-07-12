import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    return ok(await prisma.paystackWebhookEvent.create({
      data: {
        event: String(payload.event ?? "unknown"),
        reference: payload.data?.reference,
        signature: request.headers.get("x-paystack-signature"),
        payload,
        processed: true,
        processedAt: new Date(),
      },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
