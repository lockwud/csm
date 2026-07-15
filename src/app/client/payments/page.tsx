import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PaymentHistoryClient } from "./PaymentHistoryClient";

type ClientPaymentRow = {
  id: string;
  reference: string;
  amount: unknown;
  currency: string;
  provider: string;
  channel: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
  order: { waybill: string; trackingCode: string } | null;
};

export default async function ClientPaymentsPage() {
  const user = await requireUser();
  const phone = user?.phone ?? user?.client?.phone;
  const paymentFilters = [
    user?.clientId ? { clientId: user.clientId } : null,
    user?.clientId ? { order: { is: { clientId: user.clientId } } } : null,
    phone ? { order: { is: { senderAddress: { is: { phone } } } } } : null,
    phone ? { order: { is: { receiverAddress: { is: { phone } } } } } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const payments = paymentFilters.length ? await prisma.paymentIntent.findMany({
    where: { OR: paymentFilters },
    include: { order: true, checkoutSessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 80,
  }) : [];

  return <PaymentHistoryClient payments={(payments as ClientPaymentRow[]).map((payment: ClientPaymentRow) => ({
    id: payment.id,
    reference: payment.reference,
    amount: Number(payment.amount),
    currency: payment.currency,
    provider: payment.provider,
    channel: payment.channel,
    status: payment.status,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
    order: payment.order ? { waybill: payment.order.waybill, trackingCode: payment.order.trackingCode } : null,
  }))} />;
}
