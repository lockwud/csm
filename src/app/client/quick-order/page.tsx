import { ClientDashboardClient } from "../dashboard/ClientDashboardClient";
import type { SettingsData, SettingsCategoryItem } from "@/lib/services/settingsService";
import { getSettings } from "@/lib/services/settingsService";

function categoryItems(settings: SettingsData, name: string) {
  return settings.categories.find((category: SettingsData["categories"][number]) => category.name === name)?.items
    .filter((item: SettingsCategoryItem) => item.active)
    .map((item: SettingsCategoryItem) => ({ id: item.id, label: item.label, value: item.value })) ?? [];
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
