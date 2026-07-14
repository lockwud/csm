import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { notifyClient } from "@/lib/services/notificationService";

const schema = z.object({ message: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.parse(await request.json());
    const ticket = await prisma.supportTicket.update({ where: { id: (await params).id }, data: { lastUpdate: input.message } });
    await notifyClient(ticket.clientId, {
      title: "Support reply added",
      body: `${ticket.reference}: ${input.message}`,
      type: "SUPPORT",
      href: "/client/support",
      metadata: { ticketId: ticket.id },
    });
    return ok(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}
