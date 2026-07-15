import { PortalSupportClient } from "@/components/portal/PortalSupportClient";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { SupportStatus } from "@/lib/types/prismaEnums";

type SupportOrderOption = {
  id: string;
  waybill: string;
  receiverAddress: { name: string; city: string };
};

type SupportTicketRow = {
  id: string;
  reference: string;
  category: string;
  priority: string;
  status: string;
  lastUpdate: string;
  updatedAt: Date;
};

function statusWhere(status?: string) {
  const closed: SupportStatus[] = ["RESOLVED", "CLOSED"];
  if (status === "resolved") return { in: closed };
  if (status === "pending") return { notIn: closed };
  return undefined;
}

function supportView(status?: string): "log" | "pending" | "resolved" {
  if (status === "pending") return "pending";
  if (status === "resolved") return "resolved";
  return "log";
}

export default async function ClientSupportPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const view = supportView(params.status);
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
      view={view}
      orders={(orders as SupportOrderOption[]).map((order: SupportOrderOption) => ({ id: order.id, label: `${order.waybill} - ${order.receiverAddress.name}, ${order.receiverAddress.city}` }))}
      tickets={(tickets as SupportTicketRow[]).map((ticket: SupportTicketRow) => ({
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
