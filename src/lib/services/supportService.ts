import type { SupportPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nextReference } from "@/lib/services/referenceService";

export async function createTicket(input: { customer: string; category?: "ADDRESS_CHANGE" | "DELAYED_DELIVERY" | "PAYMENT_ISSUE" | "DAMAGED_ITEM" | "GENERAL"; priority?: SupportPriority; orderId?: string; clientId?: string; lastUpdate?: string }) {
  return prisma.supportTicket.create({
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
}
