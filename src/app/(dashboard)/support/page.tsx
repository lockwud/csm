import { prisma } from "@/lib/prisma";
import { SupportDeskClient } from "./SupportDeskClient";

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
      initialTickets={tickets.map((ticket) => ({
        ...ticket,
        openedAt: ticket.openedAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      }))}
      owners={owners}
    />
  );
}
