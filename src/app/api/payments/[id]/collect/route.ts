import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.order.update({ where: { id: (await params).id }, data: { paymentStatus: "PAID", amountCollected: { set: 0 } } }));
  } catch (error) {
    return handleApiError(error);
  }
}
