import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getOrder } from "@/lib/services/orderService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder((await params).id);
    return order ? ok(order) : fail(404, "Order not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.order.update({ where: { id: (await params).id }, data: await request.json() }));
  } catch (error) {
    return handleApiError(error);
  }
}
