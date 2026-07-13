import { ClientDashboardClient } from "../dashboard/ClientDashboardClient";
import { getSettings } from "@/lib/services/settingsService";

function categoryItems(settings: Awaited<ReturnType<typeof getSettings>>, name: string) {
  return settings.categories.find((category) => category.name === name)?.items
    .filter((item) => item.active)
    .map((item) => ({ id: item.id, label: item.label, value: item.value })) ?? [];
}

export default async function ClientQuickOrderPage() {
  const settings = await getSettings();
  return (
    <ClientDashboardClient
      options={{
        orderTypes: categoryItems(settings, "order-types"),
        packageTypes: categoryItems(settings, "package-types"),
        paymentMethods: categoryItems(settings, "payment-methods"),
        deliveryZones: categoryItems(settings, "delivery-zones"),
      }}
    />
  );
}
