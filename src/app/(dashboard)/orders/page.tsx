import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listOrders } from "@/lib/services/orderService";
import { formatDate } from "@/lib/utils/dateHelpers";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string; city?: string }> }) {
  const params = await searchParams;
  const selectedCity = params.city?.trim() || "";
  const data = await listOrders({
    page: Number(params.page ?? 1),
    q: params.q,
    status: params.status as OrderStatus | undefined,
    city: selectedCity || undefined,
  });
  const cities = await prisma.order.findMany({
    distinct: ["city"],
    select: { city: true },
    where: { city: { not: "" } },
    orderBy: { city: "asc" },
  });

  function cityHref(city?: string) {
    const nextParams = new URLSearchParams();
    if (params.status) nextParams.set("status", params.status);
    if (params.q) nextParams.set("q", params.q);
    if (city) nextParams.set("city", city);
    const query = nextParams.toString();
    return query ? `/orders?${query}` : "/orders";
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Orders</h1><p className="text-sm text-text-muted">Search, filter, assign, and track courier orders.</p></div>
        <details className="group relative">
          <summary className="flex h-10 min-w-44 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-3 text-sm font-bold text-text shadow-sm ring-1 ring-border transition hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
            <span>{selectedCity || "All Cities"}</span>
            <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-border bg-white p-2 shadow-xl">
            <Link href={cityHref()} className={!selectedCity ? "flex items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-sm font-bold text-brand" : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}>
              <Check className={!selectedCity ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              All Cities
            </Link>
            {cities.map((item) => (
              <Link key={item.city} href={cityHref(item.city)} className={selectedCity.toLowerCase() === item.city.toLowerCase() ? "flex items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-sm font-bold text-brand" : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}>
                <Check className={selectedCity.toLowerCase() === item.city.toLowerCase() ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
                {item.city}
              </Link>
            ))}
          </div>
        </details>
      </div>
      <Card>
        <CardHeader><CardTitle>All Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table><THead><TR><TH>Waybill</TH><TH>Placed</TH><TH>Type</TH><TH>Route</TH><TH>Status</TH><TH>COD</TH><TH>Rider</TH></TR></THead><TBody>
            {data.items.map((order) => (
              <TR key={order.id}>
                <TD><Link className="font-bold text-brand" href={`/orders/${order.id}`}>{order.waybill}</Link><p className="text-xs text-text-muted">{order.trackingCode}</p></TD>
                <TD>{formatDate(order.createdAt)}</TD>
                <TD>{order.deliveryType.replaceAll("_", " ")}</TD>
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
