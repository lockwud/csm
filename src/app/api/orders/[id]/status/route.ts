import { NextRequest } from "next/server";
import type { OrderStatus } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api/response";
import { statusSchema } from "@/lib/api/validators/cms";
import { updateOrderStatus } from "@/lib/services/orderService";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = statusSchema.parse(await request.json());
    return ok(await updateOrderStatus((await params).id, input.status as OrderStatus, input));
  } catch (error) {
    return handleApiError(error);
  }
}
