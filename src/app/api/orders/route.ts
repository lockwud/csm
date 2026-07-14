import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { orderSchema } from "@/lib/api/validators/cms";
import { getSession } from "@/lib/auth/session";
import type { OrderStatus } from "@prisma/client";
import { createOrder, listOrders } from "@/lib/services/orderService";

export async function GET(request: NextRequest) {
  try {
    return ok(await listOrders({
      page: Number(request.nextUrl.searchParams.get("page") ?? 1),
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      status: request.nextUrl.searchParams.get("status") as OrderStatus | null,
      city: request.nextUrl.searchParams.get("city"),
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const input = orderSchema.parse(await request.json());
    return created(await createOrder({ ...input, clientId: input.clientId ?? session?.clientId ?? undefined }));
  } catch (error) {
    return handleApiError(error);
  }
}
