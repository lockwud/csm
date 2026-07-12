import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { getOrder } from "@/lib/services/orderService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder((await params).id);
    return order ? ok(order.trackingEvents) : fail(404, "Order not found");
  } catch (error) {
    return handleApiError(error);
  }
}
