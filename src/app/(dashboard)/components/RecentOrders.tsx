import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

type RecentOrder = Awaited<ReturnType<typeof import("@/lib/services/dashboardService").getDashboardMetrics>>["recentOrders"][number];

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Link href="/orders" className="text-sm font-bold text-brand">View all</Link>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <THead>
            <TR><TH>Order</TH><TH>Sender / Recipient</TH><TH>Status</TH><TH>Location</TH></TR>
          </THead>
          <TBody>
            {orders.map((order) => (
              <TR key={order.id}>
                <TD className="font-bold">{order.waybill}</TD>
                <TD>{order.senderAddress.name} → {order.receiverAddress.name}</TD>
                <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                <TD>{order.receiverAddress.city}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
