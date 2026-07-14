import { PortalSupportClient } from "@/components/portal/PortalSupportClient";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { SupportStatus } from "@/lib/types/prismaEnums";

function statusWhere(status?: string) {
  const closed: SupportStatus[] = ["RESOLVED", "CLOSED"];
  if (status === "resolved") return { in: closed };
  if (status === "pending") return { notIn: closed };
  return undefined;
}

export default async function ClientSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const user = await requireUser();
  const [orders, tickets] = user?.clientId ? await Promise.all([
    prisma.order.findMany({
      where: { clientId: user.clientId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, waybill: true, receiverAddress: { select: { name: true, city: true } } },
    }),
    prisma.supportTicket.findMany({
      where: { clientId: user.clientId, status: statusWhere(params.status) },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]) : [[], []];

  return (
    <PortalSupportClient
      customer={user?.name ?? user?.client?.businessName ?? "Client"}
      clientId={user?.clientId}
      orders={orders.map((order) => ({ id: order.id, label: `${order.waybill} - ${order.receiverAddress.name}, ${order.receiverAddress.city}` }))}
      tickets={tickets.map((ticket) => ({
        id: ticket.id,
        reference: ticket.reference,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        lastUpdate: ticket.lastUpdate,
        updatedAt: ticket.updatedAt,
      }))}
    />
  );
}
