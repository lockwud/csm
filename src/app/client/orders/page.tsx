import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ClientOrdersClient } from "./ClientOrdersClient";

function deliveryFeeFromDescription(description?: string | null) {
  return Number(description?.match(/Delivery fee GHS ([0-9.]+)/)?.[1] ?? 0);
}

function senderShareFromDescription(description?: string | null) {
  const split = description?.match(/Payment Split \((\d+)\/(\d+)\)/);
  if (split) return Number(split[1]) / 100;
  if (description?.includes("Payment Recipient")) return 0;
  return 1;
}

type ClientOrderRow = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  paymentStatus: string;
  description: string | null;
  amountCollected: unknown;
  senderAddress: { city: string; phone: string };
  receiverAddress: { city: string; phone: string };
  rider: { name: string; phone: string } | null;
  paymentIntents: Array<{
    id: string;
    reference: string;
    amount: unknown;
    currency: string;
    status: string;
    authorizationUrl: string | null;
  }>;
};

export default async function ClientOrdersPage() {
  const user = await requireUser();
  const clientId = user?.clientId;
  const phone = user?.phone ?? user?.client?.phone;
  const orderFilters = [
    clientId ? { clientId } : null,
    phone ? { senderAddress: { is: { phone } } } : null,
    phone ? { receiverAddress: { is: { phone } } } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const orders = orderFilters.length ? await prisma.order.findMany({
    where: {
      OR: orderFilters,
    },
    include: {
      senderAddress: true,
      receiverAddress: true,
      rider: true,
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  }) : [];

  return (
    <ClientOrdersClient
      client={user?.client ? { id: user.client.id, email: user.client.email ?? user.email } : null}
      orders={(orders as ClientOrderRow[]).map((order: ClientOrderRow) => {
        const direction = phone && order.receiverAddress.phone === phone ? "Receiving" : "Sending";
        const payment = order.paymentIntents[0];
        const senderDue = deliveryFeeFromDescription(order.description) * senderShareFromDescription(order.description);
        const collected = Number(order.amountCollected ?? 0);
        const amountDueNow = payment && ["INITIALIZED", "PENDING", "AUTHORIZED"].includes(payment.status)
          ? Number(payment.amount)
          : Math.max(0, Number((senderDue - collected).toFixed(2)));
        return {
          id: order.id,
          waybill: order.waybill,
          trackingCode: order.trackingCode,
          status: order.status,
          paymentStatus: order.paymentStatus,
          direction,
          route: `${order.senderAddress.city} to ${order.receiverAddress.city}`,
          rider: order.rider ? { name: order.rider.name, phone: order.rider.phone } : null,
          latestPayment: payment ? {
            id: payment.id,
            reference: payment.reference,
            amount: Number(payment.amount),
            currency: payment.currency,
            status: payment.status,
            authorizationUrl: payment.authorizationUrl,
          } : null,
          amountDueNow,
        };
      })}
    />
  );
}
