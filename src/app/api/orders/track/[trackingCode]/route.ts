import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { trackOrder } from "@/lib/services/orderService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ trackingCode: string }> }) {
  try {
    const order = await trackOrder((await params).trackingCode);
    return order ? ok(order) : fail(404, "Tracking code not found");
  } catch (error) {
    return handleApiError(error);
  }
}
