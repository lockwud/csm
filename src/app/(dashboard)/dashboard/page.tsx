import { DashboardStats } from "../components/DashboardStats";
import { RecentOrders } from "../components/RecentOrders";
import { StatusBreakdown } from "../components/StatusBreakdown";
import { DeliveryTrendChart } from "../components/Charts/DeliveryTrendChart";
import { ShipmentSummaryChart } from "../components/Charts/ShipmentSummaryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getDashboardMetrics } from "@/lib/services/dashboardService";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-text-muted">Live courier operations overview.</p>
      </div>
      <DashboardStats stats={metrics.stats} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusBreakdown data={metrics.charts.statusBreakdown} />
            <ShipmentSummaryChart data={metrics.charts.shipmentSummary} />
          </div>
          <DeliveryTrendChart data={metrics.charts.trend} />
          <RecentOrders orders={metrics.recentOrders} />
        </div>
        <aside className="grid content-start gap-4">
          <Card><CardHeader><CardTitle>Rider Status Breakdown</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm"><p>Online Riders <strong className="float-right">{metrics.sidebar.riders.online}</strong></p><p>On Delivery <strong className="float-right">{metrics.sidebar.riders.onDelivery}</strong></p></CardContent></Card>
          <Card><CardHeader><CardTitle>Customer Requests</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm"><p>Pending <strong className="float-right">{metrics.sidebar.requests.pending}</strong></p><p>Resolved <strong className="float-right">{metrics.sidebar.requests.resolved}</strong></p><p>Escalated <strong className="float-right">{metrics.sidebar.requests.escalated}</strong></p></CardContent></Card>
        </aside>
      </div>
    </div>
  );
}
