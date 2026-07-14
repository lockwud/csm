import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { notifyClient } from "@/lib/services/notificationService";

const updateSchema = z.object({
  status: z.enum(["OPEN", "WAITING_CUSTOMER", "ESCALATED", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  ownerId: z.string().nullable().optional(),
  lastUpdate: z.string().min(1).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: (await params).id }, include: { order: true, client: true, owner: true } });
    return ticket ? ok(ticket) : fail(404, "Ticket not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = updateSchema.parse(await request.json());
    const resolvedAt = input.status === "RESOLVED" || input.status === "CLOSED"
      ? new Date()
      : input.status === "OPEN" || input.status === "WAITING_CUSTOMER" || input.status === "ESCALATED"
        ? null
        : undefined;
    const ticket = await prisma.supportTicket.update({
      where: { id: (await params).id },
      data: {
        status: input.status,
        priority: input.priority,
        ownerId: input.ownerId,
        lastUpdate: input.lastUpdate,
        resolvedAt,
      },
      include: { order: true, client: true, owner: true },
    });
    await notifyClient(ticket.clientId, {
      title: ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "Support ticket resolved" : "Support ticket updated",
      body: `${ticket.reference}: ${ticket.lastUpdate ?? ticket.status.replaceAll("_", " ").toLowerCase()}.`,
      type: "SUPPORT",
      href: "/client/support",
      metadata: { ticketId: ticket.id },
    });
    return ok(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
