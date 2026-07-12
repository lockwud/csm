import { prisma } from "@/lib/prisma";
import { dailyCode } from "@/lib/api/ids";

export async function createFinanceEntry(input: { type: "COD_COLLECTION" | "CLIENT_PAYOUT" | "RIDER_PAYOUT" | "INVOICE" | "REFUND" | "ADJUSTMENT"; party: string; amount: number; orderId?: string; clientId?: string; riderId?: string; notes?: string }) {
  return prisma.financeEntry.create({
    data: {
      reference: dailyCode("FIN"),
      type: input.type,
      party: input.party,
      amount: input.amount,
      date: new Date(),
      orderId: input.orderId,
      clientId: input.clientId,
      riderId: input.riderId,
      notes: input.notes,
    },
  });
}
