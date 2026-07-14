import type { SupportPriority } from "@/lib/types/prismaEnums";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyClient } from "@/lib/services/notificationService";
import { nextReference } from "@/lib/services/referenceService";

export async function createTicket(input: { customer: string; category?: "ADDRESS_CHANGE" | "DELAYED_DELIVERY" | "PAYMENT_ISSUE" | "DAMAGED_ITEM" | "GENERAL"; priority?: SupportPriority; orderId?: string; clientId?: string; lastUpdate?: string }) {
  const ticket = await prisma.supportTicket.create({
    data: {
      reference: await nextReference("Support Ticket"),
      customer: input.customer,
      category: input.category ?? "GENERAL",
      priority: input.priority ?? "MEDIUM",
      orderId: input.orderId,
      clientId: input.clientId,
      lastUpdate: input.lastUpdate ?? "Ticket opened",
    },
  });

  await Promise.all([
    notifyClient(ticket.clientId, {
      title: "Support ticket opened",
      body: `${ticket.reference} has been opened. We will follow up from your support page.`,
      type: "SUPPORT",
      href: "/client/support",
      metadata: { ticketId: ticket.id },
    }),
    notifyAdmins({
      title: "New support ticket",
      body: `${ticket.reference} was opened by ${ticket.customer}.`,
      type: "SUPPORT",
      href: "/support",
      metadata: { ticketId: ticket.id },
    }),
  ]);

  return ticket;
}
