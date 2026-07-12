import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const [
    pending,
    pickedUp,
    inTransit,
    outForDelivery,
    delivered,
    failed,
    codPending,
    codCollected,
    activeRiders,
    deliveringRiders,
    offlineRiders,
    recentOrders,
    openTickets,
    resolvedTickets,
    escalatedTickets,
  ] = await prisma.$transaction([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PICKED_UP" } }),
    prisma.order.count({ where: { status: "IN_TRANSIT" } }),
    prisma.order.count({ where: { status: "OUT_FOR_DELIVERY" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.aggregate({ _sum: { amountToCollect: true }, where: { paymentStatus: { not: "PAID" } } }),
    prisma.order.aggregate({ _sum: { amountCollected: true }, where: { paymentStatus: "PAID" } }),
    prisma.rider.count({ where: { status: "ACTIVE" } }),
    prisma.rider.count({ where: { status: "ON_DELIVERY" } }),
    prisma.rider.count({ where: { status: "OFFLINE" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { senderAddress: true, receiverAddress: true, rider: true },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "WAITING_CUSTOMER"] } } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.supportTicket.count({ where: { status: "ESCALATED" } }),
  ]);

  const activeShipments = pending + pickedUp + inTransit + outForDelivery;
  return {
    stats: {
      activeShipments: { total: activeShipments, pending, active: pickedUp + inTransit + outForDelivery, delayed: failed },
      deliveries: { total: inTransit + outForDelivery + delivered + failed, inTransit: inTransit + outForDelivery, delivered, failed },
      cod: { pending: Number(codPending._sum.amountToCollect ?? 0), collected: Number(codCollected._sum.amountCollected ?? 0), overdue: 0 },
      riders: { total: activeRiders + deliveringRiders + offlineRiders, available: activeRiders, delivering: deliveringRiders, offline: offlineRiders },
    },
    charts: {
      statusBreakdown: [
        { label: "Pending", value: pending },
        { label: "Picked", value: pickedUp },
        { label: "Transit", value: inTransit },
        { label: "Out", value: outForDelivery },
        { label: "Delivered", value: delivered },
        { label: "Failed", value: failed },
      ],
      shipmentSummary: [
        { label: "Active", value: activeShipments },
        { label: "Delivered", value: delivered },
        { label: "Failed", value: failed },
      ],
      trend: [
        { label: "Mon", shipments: Math.max(1, Math.round(activeShipments * 0.6)), delivered: Math.max(0, Math.round(delivered * 0.4)) },
        { label: "Tue", shipments: Math.max(1, Math.round(activeShipments * 0.8)), delivered: Math.max(0, Math.round(delivered * 0.55)) },
        { label: "Wed", shipments: activeShipments, delivered },
        { label: "Thu", shipments: activeShipments + 2, delivered: delivered + 1 },
        { label: "Fri", shipments: activeShipments + 4, delivered: delivered + 2 },
      ],
    },
    recentOrders,
    sidebar: {
      riders: { online: activeRiders, onDelivery: deliveringRiders },
      requests: { pending: openTickets, resolved: resolvedTickets, escalated: escalatedTickets },
    },
  };
}
