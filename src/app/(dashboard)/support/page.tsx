import { prisma } from "@/lib/prisma";
import { SupportDeskClient } from "./SupportDeskClient";

type AdminSupportTicketRow = Record<string, unknown> & {
  id: string;
  reference: string;
  customer: string;
  channel: string;
  category: string;
  priority: string;
  status: string;
  lastUpdate: string | null;
  openedAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  client: { id: string; businessName: string; contactName: string; phone: string; email: string | null; tier: string } | null;
  owner: { id: string; name: string; email: string } | null;
  order: {
    id: string;
    waybill: string;
    trackingCode: string;
    status: string;
    city: string;
    senderAddress: { name: string; phone: string; city: string; addressLine1: string };
    receiverAddress: { name: string; phone: string; city: string; addressLine1: string };
  } | null;
};

export default async function SupportPage() {
  const [tickets, owners] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        reference: true,
        customer: true,
        channel: true,
        category: true,
        priority: true,
        status: true,
        lastUpdate: true,
        openedAt: true,
        updatedAt: true,
        resolvedAt: true,
        client: { select: { id: true, businessName: true, contactName: true, phone: true, email: true, tier: true } },
        owner: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true,
            waybill: true,
            trackingCode: true,
            status: true,
            city: true,
            senderAddress: { select: { name: true, phone: true, city: true, addressLine1: true } },
            receiverAddress: { select: { name: true, phone: true, city: true, addressLine1: true } },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] }, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <SupportDeskClient
      initialTickets={(tickets as AdminSupportTicketRow[]).map((ticket: AdminSupportTicketRow) => ({
        ...ticket,
        openedAt: ticket.openedAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      }))}
      owners={owners}
    />
  );
}
