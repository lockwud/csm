import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function result(type: string, title: string, subtitle: string, href: string) {
  return { type, title, subtitle, href };
}

type SearchOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  senderAddress: { city: string };
  receiverAddress: { city: string };
};
type SearchTicket = { reference: string; status: string; customer: string };
type SearchClient = { businessName: string; phone: string };
type SearchRider = { id: string; name: string; zone: string; status: string };

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Authentication required");
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q) return ok([]);

    const isAdmin = ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT", "FINANCE"].includes(session.role);
    const orderSearch = [
      { waybill: { contains: q, mode: "insensitive" as const } },
      { trackingCode: { contains: q, mode: "insensitive" as const } },
      { city: { contains: q, mode: "insensitive" as const } },
      { senderAddress: { name: { contains: q, mode: "insensitive" as const } } },
      { receiverAddress: { name: { contains: q, mode: "insensitive" as const } } },
    ];
    const orderWhere = {
      OR: [
        ...orderSearch,
        ...(isAdmin ? [] : session.role === "CLIENT"
          ? [
              { clientId: session.clientId ?? "__none__" },
              { senderAddress: { phone: { contains: q, mode: "insensitive" as const } } },
              { receiverAddress: { phone: { contains: q, mode: "insensitive" as const } } },
            ]
          : [{ riderId: session.riderId ?? "__none__" }]),
      ],
    };

    const [orders, tickets, clients, riders] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        include: { senderAddress: true, receiverAddress: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.supportTicket.findMany({
        where: {
          ...(isAdmin ? {} : session.role === "CLIENT" ? { clientId: session.clientId ?? "__none__" } : {}),
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { customer: { contains: q, mode: "insensitive" } },
            { lastUpdate: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      isAdmin ? prisma.client.findMany({
        where: {
          OR: [
            { businessName: { contains: q, mode: "insensitive" as const } },
            { contactName: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        },
        take: 5,
      }) : Promise.resolve([]),
      isAdmin ? prisma.rider.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { zone: { contains: q, mode: "insensitive" as const } },
          ],
        },
        take: 5,
      }) : Promise.resolve([]),
    ]);

    return ok([
      ...(orders as SearchOrder[]).map((order: SearchOrder) => result(
        "Order",
        order.waybill,
        `${order.status.replaceAll("_", " ")} · ${order.senderAddress.city} to ${order.receiverAddress.city}`,
        isAdmin ? `/orders/${order.id}` : session.role === "RIDER" ? "/rider/orders" : `/track/${order.trackingCode}`,
      )),
      ...(tickets as SearchTicket[]).map((ticket: SearchTicket) => result(
        "Support",
        ticket.reference,
        `${ticket.status.replaceAll("_", " ")} · ${ticket.customer}`,
        isAdmin ? "/support" : session.role === "RIDER" ? "/rider/support" : "/client/support",
      )),
      ...(clients as SearchClient[]).map((client: SearchClient) => result("Client", client.businessName, client.phone, "/clients")),
      ...(riders as SearchRider[]).map((rider: SearchRider) => result("Rider", rider.name, `${rider.zone} · ${rider.status.replaceAll("_", " ")}`, `/riders/${rider.id}`)),
    ].slice(0, 12));
  } catch (error) {
    return handleApiError(error);
  }
}
