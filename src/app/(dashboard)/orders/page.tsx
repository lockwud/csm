import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import type { OrderStatus } from "@prisma/client";
import { listOrders } from "@/lib/services/orderService";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string; city?: string }> }) {
  const params = await searchParams;
  const data = await listOrders({
    page: Number(params.page ?? 1),
    q: params.q,
    status: params.status as OrderStatus | undefined,
    city: params.city,
  });
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-sm text-text-muted">Search, filter, assign, and track courier orders.</p></div>
      <FilterBar />
      <Card>
        <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table><THead><TR><TH>Waybill</TH><TH>Route</TH><TH>Status</TH><TH>COD</TH><TH>Rider</TH></TR></THead><TBody>
            {data.items.map((order) => (
              <TR key={order.id}>
                <TD><Link className="font-bold text-brand" href={`/orders/${order.id}`}>{order.waybill}</Link><p className="text-xs text-text-muted">{order.trackingCode}</p></TD>
                <TD>{order.senderAddress.city} → {order.receiverAddress.city}</TD>
                <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                <TD>{formatCurrency(String(order.amountToCollect))}</TD>
                <TD>{order.rider?.name ?? "Unassigned"}</TD>
              </TR>
            ))}
          </TBody></Table>
        </CardContent>
      </Card>
      <Pagination page={data.page} total={data.total} pageSize={data.pageSize} />
    </div>
  );
}
