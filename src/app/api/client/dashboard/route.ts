import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.clientId) return fail(401, "Client session required");
    const client = await prisma.client.findUnique({ where: { id: session.clientId } });
    const phone = client?.phone;
    const orderFilters = [
      { clientId: session.clientId },
      phone ? { senderAddress: { is: { phone } } } : null,
      phone ? { receiverAddress: { is: { phone } } } : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item));
    const where = { clientId: session.clientId };
    const [orders, rewards, tickets, payments] = await Promise.all([
      prisma.order.findMany({
        where: { OR: orderFilters },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { senderAddress: true, receiverAddress: true, rider: true },
      }),
      prisma.rewardLedger.findMany({ where, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.supportTicket.findMany({ where, orderBy: { openedAt: "desc" }, take: 10 }),
      prisma.paymentIntent.findMany({ where, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    const activeOrders = orders.filter((order) => ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status));
    const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
    const paidPayments = payments.filter((payment) => payment.status === "PAID");
    const pendingPayments = payments.filter((payment) => ["PENDING", "INITIALIZED", "AUTHORIZED"].includes(payment.status));
    const trackedOrder = activeOrders.find((order) => order.riderId) ?? activeOrders[0] ?? orders[0];
    const riderLocation = trackedOrder?.riderId
      ? await prisma.appSetting.findFirst({
        where: { key: "live_location", scope: "RIDER", riderId: trackedOrder.riderId },
        orderBy: { updatedAt: "desc" },
      })
      : null;

    return ok({
      client,
      stats: {
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        deliveredOrders: orders.filter((order) => order.status === "DELIVERED").length,
        pendingOrders: orders.filter((order) => order.status === "PENDING").length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        paidAmount: paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        openTickets: openTickets.length,
        resolvedTickets: tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status)).length,
        escalatedTickets: tickets.filter((ticket) => ticket.status === "ESCALATED").length,
        rewardPoints: rewards.reduce((sum, item) => sum + item.points, 0),
      },
      liveTracking: trackedOrder ? {
        orderId: trackedOrder.id,
        waybill: trackedOrder.waybill,
        trackingCode: trackedOrder.trackingCode,
        status: trackedOrder.status,
        rider: trackedOrder.rider,
        location: riderLocation?.value ?? null,
      } : null,
      orders,
      payments,
      rewards,
      tickets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
