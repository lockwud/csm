import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type ClientDashboardOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  riderId: string | null;
  rider: unknown;
};

type ClientDashboardTicket = { status: string };
type ClientDashboardPayment = { amount: unknown; status: string };
type ClientDashboardReward = { points: number };

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
      prisma.paymentIntent.findMany({
        where: {
          OR: [
            { clientId: session.clientId },
            { order: { is: { OR: orderFilters } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
    ]);
    const dashboardOrders = orders as ClientDashboardOrder[];
    const dashboardTickets = tickets as ClientDashboardTicket[];
    const dashboardPayments = payments as ClientDashboardPayment[];
    const dashboardRewards = rewards as ClientDashboardReward[];
    const activeOrders = dashboardOrders.filter((order: ClientDashboardOrder) => ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status));
    const openTickets = dashboardTickets.filter((ticket: ClientDashboardTicket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
    const paidPayments = dashboardPayments.filter((payment: ClientDashboardPayment) => payment.status === "PAID");
    const pendingPayments = dashboardPayments.filter((payment: ClientDashboardPayment) => ["PENDING", "INITIALIZED", "AUTHORIZED"].includes(payment.status));
    const failedPayments = dashboardPayments.filter((payment: ClientDashboardPayment) => ["FAILED", "ABANDONED"].includes(payment.status));
    const trackedOrder = activeOrders.find((order: ClientDashboardOrder) => order.riderId) ?? activeOrders[0] ?? dashboardOrders[0];
    const riderLocation = trackedOrder?.riderId
      ? await prisma.appSetting.findFirst({
        where: { key: "live_location", scope: "RIDER", riderId: trackedOrder.riderId },
        orderBy: { updatedAt: "desc" },
      })
      : null;

    return ok({
      client,
      stats: {
        totalOrders: dashboardOrders.length,
        activeOrders: activeOrders.length,
        deliveredOrders: dashboardOrders.filter((order: ClientDashboardOrder) => order.status === "DELIVERED").length,
        pendingOrders: dashboardOrders.filter((order: ClientDashboardOrder) => order.status === "PENDING").length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        failedPayments: failedPayments.length,
        paidAmount: paidPayments.reduce((sum: number, payment: ClientDashboardPayment) => sum + Number(payment.amount), 0),
        openTickets: openTickets.length,
        resolvedTickets: dashboardTickets.filter((ticket: ClientDashboardTicket) => ["RESOLVED", "CLOSED"].includes(ticket.status)).length,
        escalatedTickets: dashboardTickets.filter((ticket: ClientDashboardTicket) => ticket.status === "ESCALATED").length,
        rewardPoints: dashboardRewards.reduce((sum: number, item: ClientDashboardReward) => sum + item.points, 0),
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
