import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createTicket } from "@/lib/services/supportService";

const schema = z.object({ customer: z.string().min(2), category: z.enum(["ADDRESS_CHANGE", "DELAYED_DELIVERY", "PAYMENT_ISSUE", "DAMAGED_ITEM", "GENERAL"]).optional(), orderId: z.string().optional(), clientId: z.string().optional() });

export async function GET() {
  try {
    return ok(await prisma.supportTicket.findMany({ include: { order: true, client: true, owner: true }, orderBy: { updatedAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await createTicket(schema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
