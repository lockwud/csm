import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function ClientOrdersPage() {
  const user = await requireUser();
  const clientId = user?.clientId;
  const phone = user?.phone ?? user?.client?.phone;
  const orderFilters = [
    clientId ? { clientId } : null,
    phone ? { receiverAddress: { is: { phone } } } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const orders = orderFilters.length ? await prisma.order.findMany({
    where: {
      OR: orderFilters,
    },
    include: {
      senderAddress: true,
      receiverAddress: true,
      rider: true,
      paymentIntents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  }) : [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-1 text-sm text-text-muted">Pending, processed, sent, and receiving packages.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead>
              <TR>
                <TH>Waybill</TH>
                <TH>Direction</TH>
                <TH>Route</TH>
                <TH>Status</TH>
                <TH>Payment</TH>
                <TH>Rider</TH>
              </TR>
            </THead>
            <TBody>
              {orders.map((order) => {
                const direction = phone && order.receiverAddress.phone === phone ? "Receiving" : "Sending";
                const payment = order.paymentIntents[0];
                return (
                  <TR key={order.id}>
                    <TD>
                      <Link href={`/track/${order.trackingCode}`} className="font-bold text-brand">{order.waybill}</Link>
                      <p className="text-xs text-text-muted">{order.trackingCode}</p>
                    </TD>
                    <TD>{direction}</TD>
                    <TD>{order.senderAddress.city} to {order.receiverAddress.city}</TD>
                    <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                    <TD>{order.paymentStatus}{payment ? ` / ${payment.status}` : ""}</TD>
                    <TD>{order.rider ? <a href={`tel:${order.rider.phone}`} className="font-semibold text-brand">{order.rider.name}</a> : "Unassigned"}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {!orders.length ? <p className="p-6 text-sm text-text-muted">No orders match this filter.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
