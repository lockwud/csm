import { prisma } from "@/lib/prisma";
import { dailyCode } from "@/lib/api/ids";

export async function createTicket(input: { customer: string; category?: "ADDRESS_CHANGE" | "DELAYED_DELIVERY" | "PAYMENT_ISSUE" | "DAMAGED_ITEM" | "GENERAL"; orderId?: string; clientId?: string }) {
  return prisma.supportTicket.create({
    data: {
      reference: dailyCode("SUP"),
      customer: input.customer,
      category: input.category ?? "GENERAL",
      orderId: input.orderId,
      clientId: input.clientId,
      lastUpdate: "Ticket opened",
    },
  });
}
