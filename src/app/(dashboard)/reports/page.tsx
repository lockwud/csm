import { BarChart3, Bike, CircleDollarSign, Download, Headphones, PackageCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { getOperationalReports } from "@/lib/services/reportService";
import type { OperationalReports } from "@/lib/services/reportService";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type CountRow = { label: string; value: number };
type RecentOrderReport = OperationalReports["operations"]["recentOrders"][number];
type RiderReport = OperationalReports["dispatch"]["riders"][number];
type ClientReport = OperationalReports["clients"]["topClients"][number];

function DownloadLink({ section }: { section: string }) {
  return (
    <a href={`/api/reports/${section}/download`} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-text hover:bg-slate-200">
      <Download className="h-3.5 w-3.5" />
      CSV
    </a>
  );
}

function CountList({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="grid gap-2">
      {items.length ? items.map((item: CountRow) => (
        <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
          <span className="font-semibold text-text-muted">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      )) : <p className="text-sm text-text-muted">No records available.</p>}
    </div>
  );
}

export default async function ReportsPage() {
  const reports = await getOperationalReports();

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-text-muted">Operational reports generated from orders, dispatch, finance, clients, and support data.</p>
        </div>
        <p className="text-xs font-semibold text-text-muted">Generated {new Date(reports.generatedAt).toLocaleString("en-GH")}</p>
      </div>

      {reports.databaseUnavailable ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-text">
          Connection is unavailable. Showing empty reports until the database can be reached.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Orders" value={reports.summary.totalOrders} icon={<PackageCheck className="h-5 w-5" />} details={[
          { label: "Active", value: reports.summary.activeOrders },
          { label: "Delivered", value: reports.summary.deliveredOrders },
          { label: "Failed", value: reports.summary.failedOrders },
        ]} />
        <StatCard title="Pending COD" value={formatCurrency(reports.summary.pendingCod)} icon={<CircleDollarSign className="h-5 w-5" />} details={[
          { label: "Collected", value: formatCurrency(reports.summary.collectedCod) },
          { label: "Pending", value: formatCurrency(reports.summary.pendingCod) },
          { label: "Currency", value: "GHS" },
        ]} />
        <StatCard title="Active Riders" value={reports.summary.activeRiders} icon={<Bike className="h-5 w-5" />} details={[
          { label: "Tracked", value: reports.dispatch.riders.length },
          { label: "Statuses", value: reports.dispatch.riderStatus.length },
          { label: "Manifests", value: reports.dispatch.manifestStatus.reduce((sum: number, item: CountRow) => sum + item.value, 0) },
        ]} />
        <StatCard title="Open Support" value={reports.summary.openSupportTickets} icon={<Headphones className="h-5 w-5" />} details={[
          { label: "Queues", value: reports.support.status.length },
          { label: "Priority", value: reports.support.priority.length },
          { label: "Recent", value: reports.support.recentTickets.length },
        ]} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Operations Report</CardTitle>
            <DownloadLink section="operations" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">Order Status</h3>
              <CountList items={reports.operations.status} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Delivery Types</h3>
              <CountList items={reports.operations.deliveryTypes} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4" /> Finance & Payments Report</CardTitle>
            <DownloadLink section="finance" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-bold">Order Payments</h3>
              <CountList items={reports.finance.paymentStatus} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Finance Entries</h3>
              <CountList items={reports.finance.financeStatus} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Gateway Totals</h3>
              <CountList items={reports.finance.paymentIntents} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders Report</CardTitle>
          <DownloadLink section="operations" />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead><TR><TH>Waybill</TH><TH>Client</TH><TH>Rider</TH><TH>City</TH><TH>Status</TH><TH>Type</TH></TR></THead>
            <TBody>
              {reports.operations.recentOrders.map((order: RecentOrderReport) => (
                <TR key={order.id}>
                  <TD><strong>{order.waybill}</strong><p className="text-xs text-text-muted">{order.trackingCode}</p></TD>
                  <TD>{order.client}</TD>
                  <TD>{order.rider}</TD>
                  <TD>{order.city}</TD>
                  <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                  <TD>{order.deliveryType.replaceAll("_", " ")}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bike className="h-4 w-4" /> Rider & Dispatch Report</CardTitle>
            <DownloadLink section="riders" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">Rider Status</h3>
              <CountList items={reports.dispatch.riderStatus} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Manifest Status</h3>
              <CountList items={reports.dispatch.manifestStatus} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Client Report</CardTitle>
            <DownloadLink section="clients" />
          </CardHeader>
          <CardContent>
            <h3 className="mb-3 text-sm font-bold">Client Tiers</h3>
            <CountList items={reports.clients.tiers} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rider Performance</CardTitle>
          <DownloadLink section="riders" />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead><TR><TH>Rider</TH><TH>Zone</TH><TH>Status</TH><TH>Orders</TH><TH>Manifests</TH><TH>Rating</TH><TH>On Time</TH></TR></THead>
            <TBody>
              {reports.dispatch.riders.map((rider: RiderReport) => (
                <TR key={rider.id}>
                  <TD className="font-bold">{rider.name}</TD>
                  <TD>{rider.zone}</TD>
                  <TD><Badge variant={rider.status === "ACTIVE" ? "success" : rider.status === "ON_DELIVERY" ? "info" : "secondary"}>{rider.status.replaceAll("_", " ")}</Badge></TD>
                  <TD>{rider.orders}</TD>
                  <TD>{rider.manifests}</TD>
                  <TD>{rider.rating.toFixed(1)}</TD>
                  <TD>{rider.onTimeRate.toFixed(1)}%</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Client Balances</CardTitle>
            <DownloadLink section="clients" />
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <THead><TR><TH>Client</TH><TH>Tier</TH><TH>Orders</TH><TH>Tickets</TH><TH>Balance</TH></TR></THead>
              <TBody>
                {reports.clients.topClients.map((client: ClientReport) => (
                  <TR key={client.id}>
                    <TD><strong>{client.businessName}</strong><p className="text-xs text-text-muted">{client.contactName}</p></TD>
                    <TD>{client.tier}</TD>
                    <TD>{client.orders}</TD>
                    <TD>{client.tickets}</TD>
                    <TD>{formatCurrency(client.outstandingBalance)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Support Report</CardTitle>
            <DownloadLink section="support" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">Status</h3>
              <CountList items={reports.support.status} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Priority</h3>
              <CountList items={reports.support.priority} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
