import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type RiderDashboardOrder = { status: string };

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.riderId) return fail(401, "Rider session required");
    const riderWhere = { id: session.riderId };
    const orderWhere = { riderId: session.riderId };
    const manifestWhere = { riderId: session.riderId };

    const [rider, orders, manifests] = await prisma.$transaction([
      prisma.rider.findUnique({ where: riderWhere }),
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { senderAddress: true, receiverAddress: true, client: true },
      }),
      prisma.dispatchManifest.findMany({
        where: manifestWhere,
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { stops: { include: { order: { include: { receiverAddress: true, senderAddress: true, client: true } } }, orderBy: { sequence: "asc" } } },
      }),
    ]);

    return ok({
      rider,
      stats: {
        assignedOrders: orders.length,
        activeOrders: (orders as RiderDashboardOrder[]).filter((order: RiderDashboardOrder) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(order.status)).length,
        deliveredOrders: (orders as RiderDashboardOrder[]).filter((order: RiderDashboardOrder) => order.status === "DELIVERED").length,
        manifests: manifests.length,
      },
      orders,
      manifests,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
