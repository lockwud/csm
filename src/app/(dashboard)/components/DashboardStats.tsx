import { Bike, CircleDollarSign, PackageCheck, Truck } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function DashboardStats({ stats }: { stats: Awaited<ReturnType<typeof import("@/lib/services/dashboardService").getDashboardMetrics>>["stats"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Active Shipments" value={stats.activeShipments.total} icon={<Truck className="h-5 w-5" />} details={[
        { label: "Pending", value: stats.activeShipments.pending },
        { label: "Active", value: stats.activeShipments.active },
        { label: "Delayed", value: stats.activeShipments.delayed },
      ]} />
      <StatCard title="Deliveries in Progress" value={stats.deliveries.total} icon={<PackageCheck className="h-5 w-5" />} details={[
        { label: "In transit", value: stats.deliveries.inTransit },
        { label: "Delivered", value: stats.deliveries.delivered },
        { label: "Failed", value: stats.deliveries.failed },
      ]} />
      <StatCard title="Pending COD" value={formatCurrency(stats.cod.pending)} icon={<CircleDollarSign className="h-5 w-5" />} details={[
        { label: "Pending", value: formatCurrency(stats.cod.pending) },
        { label: "Collected", value: formatCurrency(stats.cod.collected) },
        { label: "Overdue", value: formatCurrency(stats.cod.overdue) },
      ]} />
      <StatCard title="Riders on Road" value={stats.riders.total} icon={<Bike className="h-5 w-5" />} details={[
        { label: "Available", value: stats.riders.available },
        { label: "Delivering", value: stats.riders.delivering },
        { label: "Offline", value: stats.riders.offline },
      ]} />
    </div>
  );
}
