import { DashboardClient } from "./DashboardClient";
import type { DashboardMetrics } from "@/lib/services/dashboardService";

const initialMetrics: DashboardMetrics = {
  stats: {
    activeShipments: { total: 0, pending: 0, active: 0, delayed: 0 },
    deliveries: { total: 0, inTransit: 0, delivered: 0, failed: 0 },
    cod: { pending: 0, collected: 0, overdue: 0 },
    riders: { total: 0, available: 0, delivering: 0, offline: 0 },
  },
  charts: {
    statusBreakdown: [
      { label: "Pending", value: 0 },
      { label: "Picked", value: 0 },
      { label: "Transit", value: 0 },
      { label: "Out", value: 0 },
      { label: "Delivered", value: 0 },
      { label: "Failed", value: 0 },
    ],
    shipmentSummary: [
      { label: "Active", value: 0 },
      { label: "Delivered", value: 0 },
      { label: "Failed", value: 0 },
    ],
    trend: [
      { label: "Mon", shipments: 0, delivered: 0 },
      { label: "Tue", shipments: 0, delivered: 0 },
      { label: "Wed", shipments: 0, delivered: 0 },
      { label: "Thu", shipments: 0, delivered: 0 },
      { label: "Fri", shipments: 0, delivered: 0 },
    ],
  },
  recentOrders: [],
  sidebar: { riders: { online: 0, onDelivery: 0 }, requests: { pending: 0, resolved: 0, escalated: 0 } },
  databaseUnavailable: false,
};

export default function DashboardPage() {
  return <DashboardClient initialData={initialMetrics} />;
}
