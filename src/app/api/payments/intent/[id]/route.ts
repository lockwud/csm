import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const intent = await prisma.paymentIntent.findUnique({ where: { id: (await params).id }, include: { checkoutSessions: true } });
    return intent ? ok(intent) : fail(404, "Payment intent not found");
  } catch (error) {
    return handleApiError(error);
  }
}
