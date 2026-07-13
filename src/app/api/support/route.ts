import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createTicket } from "@/lib/services/supportService";

const schema = z.object({
  customer: z.string().min(2),
  category: z.enum(["ADDRESS_CHANGE", "DELAYED_DELIVERY", "PAYMENT_ISSUE", "DAMAGED_ITEM", "GENERAL"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  lastUpdate: z.string().min(2).optional(),
});

const ticketSelect = {
  id: true,
  reference: true,
  customer: true,
  channel: true,
  category: true,
  priority: true,
  status: true,
  lastUpdate: true,
  openedAt: true,
  updatedAt: true,
  resolvedAt: true,
  client: { select: { id: true, businessName: true, contactName: true, phone: true, email: true, tier: true } },
  owner: { select: { id: true, name: true, email: true } },
  order: {
    select: {
      id: true,
      waybill: true,
      trackingCode: true,
      status: true,
      city: true,
      senderAddress: { select: { name: true, phone: true, city: true, addressLine1: true } },
      receiverAddress: { select: { name: true, phone: true, city: true, addressLine1: true } },
    },
  },
} as const;

function statusWhere(status: string | null) {
  if (status === "PENDING") return { notIn: ["RESOLVED", "CLOSED"] as Array<"RESOLVED" | "CLOSED"> };
  if (status && ["OPEN", "WAITING_CUSTOMER", "ESCALATED", "RESOLVED", "CLOSED"].includes(status)) return status as "OPEN" | "WAITING_CUSTOMER" | "ESCALATED" | "RESOLVED" | "CLOSED";
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    return ok(await prisma.supportTicket.findMany({
      where: { status: statusWhere(status) },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: ticketSelect,
    }));
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
