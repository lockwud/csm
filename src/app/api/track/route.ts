import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { trackOrder } from "@/lib/services/orderService";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code") ?? "";
    const order = await trackOrder(code);
    return order ? ok(order) : fail(404, "Tracking code not found");
  } catch (error) {
    return handleApiError(error);
  }
}
