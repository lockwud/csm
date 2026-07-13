import { prisma } from "@/lib/prisma";

type CountRow = { label: string; value: number };

export type OperationalReports = {
  databaseUnavailable: boolean;
  generatedAt: string;
  summary: {
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    failedOrders: number;
    pendingCod: number;
    collectedCod: number;
    activeRiders: number;
    openSupportTickets: number;
  };
  operations: {
    status: CountRow[];
    deliveryTypes: CountRow[];
    recentOrders: Array<{
      id: string;
      waybill: string;
      trackingCode: string;
      status: string;
      deliveryType: string;
      city: string;
      client: string;
      rider: string;
      createdAt: string;
    }>;
  };
  finance: {
    paymentStatus: CountRow[];
    financeStatus: CountRow[];
    paymentIntents: CountRow[];
    recentPayments: Array<{
      id: string;
      reference: string;
      status: string;
      channel: string;
      amount: number;
      client: string;
      order: string;
      createdAt: string;
    }>;
  };
  dispatch: {
    riderStatus: CountRow[];
    manifestStatus: CountRow[];
    riders: Array<{
      id: string;
      name: string;
      zone: string;
      status: string;
      orders: number;
      manifests: number;
      rating: number;
      onTimeRate: number;
    }>;
  };
  clients: {
    tiers: CountRow[];
    topClients: Array<{
      id: string;
      businessName: string;
      contactName: string;
      tier: string;
      outstandingBalance: number;
      orders: number;
      tickets: number;
    }>;
  };
  support: {
    status: CountRow[];
    priority: CountRow[];
    recentTickets: Array<{
      id: string;
      reference: string;
      customer: string;
      status: string;
      priority: string;
      category: string;
      openedAt: string;
    }>;
  };
};

const emptyReports: OperationalReports = {
  databaseUnavailable: true,
  generatedAt: new Date(0).toISOString(),
  summary: {
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    failedOrders: 0,
    pendingCod: 0,
    collectedCod: 0,
    activeRiders: 0,
    openSupportTickets: 0,
  },
  operations: { status: [], deliveryTypes: [], recentOrders: [] },
  finance: { paymentStatus: [], financeStatus: [], paymentIntents: [], recentPayments: [] },
  dispatch: { riderStatus: [], manifestStatus: [], riders: [] },
  clients: { tiers: [], topClients: [] },
  support: { status: [], priority: [], recentTickets: [] },
};

function rows<T extends string>(items: Array<{ label: T; value: number }>) {
  return items.map((item) => ({ label: item.label.replaceAll("_", " "), value: item.value }));
}

function countBy(items: unknown[], key: string) {
  return rows(items.map((item) => {
    const row = item as Record<string, unknown>;
    const count = row._count;
    const value = typeof count === "number"
      ? count
      : typeof count === "object" && count ? Number((count as { _all?: number })._all ?? 0) : 0;
    return { label: String(row[key]), value };
  }));
}

export async function getOperationalReports(): Promise<OperationalReports> {
  try {
    const [
      totalOrders,
      activeOrders,
      deliveredOrders,
      failedOrders,
      pendingCod,
      collectedCod,
      activeRiders,
      openSupportTickets,
      orderStatus,
      deliveryTypes,
      recentOrders,
      paymentStatus,
      financeStatus,
      paymentIntents,
      recentPayments,
      riderStatus,
      manifestStatus,
      riders,
      clientTiers,
      topClients,
      supportStatus,
      supportPriority,
      recentTickets,
    ] = await prisma.$transaction([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] } } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.order.aggregate({ _sum: { amountToCollect: true }, where: { paymentStatus: { not: "PAID" } } }),
      prisma.order.aggregate({ _sum: { amountCollected: true }, where: { paymentStatus: "PAID" } }),
      prisma.rider.count({ where: { status: { in: ["ACTIVE", "ON_DELIVERY"] } } }),
      prisma.supportTicket.count({ where: { status: { in: ["OPEN", "WAITING_CUSTOMER", "ESCALATED"] } } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.order.groupBy({ by: ["deliveryType"], _count: { _all: true }, orderBy: { deliveryType: "asc" } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { client: true, rider: true },
      }),
      prisma.order.groupBy({ by: ["paymentStatus"], _count: { _all: true }, orderBy: { paymentStatus: "asc" } }),
      prisma.financeEntry.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.paymentIntent.groupBy({ by: ["status"], _sum: { amount: true }, orderBy: { status: "asc" } }),
      prisma.paymentIntent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { client: true, order: true },
      }),
      prisma.rider.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.dispatchManifest.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.rider.findMany({
        orderBy: { name: "asc" },
        take: 12,
        include: { _count: { select: { orders: true, manifests: true } } },
      }),
      prisma.client.groupBy({ by: ["tier"], _count: { _all: true }, orderBy: { tier: "asc" } }),
      prisma.client.findMany({
        orderBy: { outstandingBalance: "desc" },
        take: 10,
        include: { _count: { select: { orders: true, supportTickets: true } } },
      }),
      prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
      prisma.supportTicket.groupBy({ by: ["priority"], _count: { _all: true }, orderBy: { priority: "asc" } }),
      prisma.supportTicket.findMany({ orderBy: { openedAt: "desc" }, take: 10 }),
    ]);

    return {
      databaseUnavailable: false,
      generatedAt: new Date().toISOString(),
      summary: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        failedOrders,
        pendingCod: Number(pendingCod._sum.amountToCollect ?? 0),
        collectedCod: Number(collectedCod._sum.amountCollected ?? 0),
        activeRiders,
        openSupportTickets,
      },
      operations: {
        status: countBy(orderStatus, "status"),
        deliveryTypes: countBy(deliveryTypes, "deliveryType"),
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          waybill: order.waybill,
          trackingCode: order.trackingCode,
          status: order.status,
          deliveryType: order.deliveryType,
          city: order.city,
          client: order.client?.businessName ?? "Walk-in",
          rider: order.rider?.name ?? "Unassigned",
          createdAt: order.createdAt.toISOString(),
        })),
      },
      finance: {
        paymentStatus: countBy(paymentStatus, "paymentStatus"),
        financeStatus: countBy(financeStatus, "status"),
        paymentIntents: paymentIntents.map((item) => ({
          label: item.status.replaceAll("_", " "),
          value: Number(item._sum?.amount ?? 0),
        })),
        recentPayments: recentPayments.map((payment) => ({
          id: payment.id,
          reference: payment.reference,
          status: payment.status,
          channel: payment.channel,
          amount: Number(payment.amount),
          client: payment.client?.businessName ?? "Walk-in",
          order: payment.order?.waybill ?? "N/A",
          createdAt: payment.createdAt.toISOString(),
        })),
      },
      dispatch: {
        riderStatus: countBy(riderStatus, "status"),
        manifestStatus: countBy(manifestStatus, "status"),
        riders: riders.map((rider) => ({
          id: rider.id,
          name: rider.name,
          zone: rider.zone,
          status: rider.status,
          orders: rider._count.orders,
          manifests: rider._count.manifests,
          rating: Number(rider.rating),
          onTimeRate: Number(rider.onTimeRate),
        })),
      },
      clients: {
        tiers: countBy(clientTiers, "tier"),
        topClients: topClients.map((client) => ({
          id: client.id,
          businessName: client.businessName,
          contactName: client.contactName,
          tier: client.tier,
          outstandingBalance: Number(client.outstandingBalance),
          orders: client._count.orders,
          tickets: client._count.supportTickets,
        })),
      },
      support: {
        status: countBy(supportStatus, "status"),
        priority: countBy(supportPriority, "priority"),
        recentTickets: recentTickets.map((ticket) => ({
          id: ticket.id,
          reference: ticket.reference,
          customer: ticket.customer,
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          openedAt: ticket.openedAt.toISOString(),
        })),
      },
    };
  } catch {
    console.warn("Reports unavailable. Check DATABASE_URL connectivity.");
    return emptyReports;
  }
}

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

export async function getOperationalReportCsv(section: string) {
  const report = await getOperationalReports();
  if (section === "finance") {
    return toCsv(["Reference", "Status", "Channel", "Amount", "Client", "Order", "Created At"], report.finance.recentPayments.map((item) => [
      item.reference,
      item.status,
      item.channel,
      item.amount,
      item.client,
      item.order,
      item.createdAt,
    ]));
  }

  if (section === "riders") {
    return toCsv(["Rider", "Zone", "Status", "Orders", "Manifests", "Rating", "On Time Rate"], report.dispatch.riders.map((item) => [
      item.name,
      item.zone,
      item.status,
      item.orders,
      item.manifests,
      item.rating,
      item.onTimeRate,
    ]));
  }

  if (section === "clients") {
    return toCsv(["Client", "Contact", "Tier", "Outstanding Balance", "Orders", "Tickets"], report.clients.topClients.map((item) => [
      item.businessName,
      item.contactName,
      item.tier,
      item.outstandingBalance,
      item.orders,
      item.tickets,
    ]));
  }

  if (section === "support") {
    return toCsv(["Reference", "Customer", "Status", "Priority", "Category", "Opened At"], report.support.recentTickets.map((item) => [
      item.reference,
      item.customer,
      item.status,
      item.priority,
      item.category,
      item.openedAt,
    ]));
  }

  return toCsv(["Waybill", "Tracking Code", "Status", "Delivery Type", "City", "Client", "Rider", "Created At"], report.operations.recentOrders.map((item) => [
    item.waybill,
    item.trackingCode,
    item.status,
    item.deliveryType,
    item.city,
    item.client,
    item.rider,
    item.createdAt,
  ]));
}
