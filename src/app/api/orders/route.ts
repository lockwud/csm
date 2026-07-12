import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { orderSchema } from "@/lib/api/validators/cms";
import { createOrder, listOrders } from "@/lib/services/orderService";

export async function GET(request: NextRequest) {
  try {
    return ok(await listOrders({
      page: Number(request.nextUrl.searchParams.get("page") ?? 1),
      q: request.nextUrl.searchParams.get("q") ?? undefined,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await createOrder(orderSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
