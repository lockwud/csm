import { prisma } from "@/lib/prisma";
import { dailyCode } from "@/lib/api/ids";

export async function createPaymentIntent(input: { amount: number; currency?: string; orderId?: string; clientId?: string; createdById?: string }) {
  return prisma.paymentIntent.create({
    data: {
      reference: dailyCode("PAY"),
      amount: input.amount,
      currency: input.currency ?? "GHS",
      orderId: input.orderId,
      clientId: input.clientId,
      createdById: input.createdById,
      status: "INITIALIZED",
      authorizationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/finance/transactions`,
    },
  });
}
