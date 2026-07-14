import { SettingsConfiguration } from "./components/SettingsConfiguration";
import type { SettingsData, SettingsCategoryItem } from "@/lib/services/settingsService";
import { getSettings } from "@/lib/services/settingsService";

type ServiceZoneRow = SettingsData["serviceZones"][number];
type PricingRuleRow = SettingsData["pricingRules"][number];
type AppSettingRow = SettingsData["appSettings"][number];

function categoryItems(data: SettingsData, name: string) {
  return (data.categories.find((category: SettingsData["categories"][number]) => category.name === name)?.items ?? []).map((item: SettingsCategoryItem) => ({
    id: item.id,
    label: item.label,
    active: item.active,
    value: item.value,
  }));
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const settings = await getSettings();
  const appSettingValue = (key: string) => settings.appSettings.find((setting: AppSettingRow) => setting.key === key)?.value;

  return (
    <div className="grid gap-4">
      {settings.databaseUnavailable ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-text">
          Connection is unavailable. Showing default settings until the database can be reached.
        </div>
      ) : null}
      <SettingsConfiguration initialTab={params.tab} data={{
    orderTypes: categoryItems(settings, "order-types"),
    packageTypes: categoryItems(settings, "package-types"),
    deliveryZones: categoryItems(settings, "delivery-zones"),
    paymentMethods: categoryItems(settings, "payment-methods"),
    codeRules: Array.isArray(appSettingValue("code_settings")) ? appSettingValue("code_settings") : undefined,
    notificationChannels: Array.isArray(appSettingValue("notification_channels")) ? appSettingValue("notification_channels") : undefined,
    serviceZones: settings.serviceZones.map((zone: ServiceZoneRow) => ({
      id: zone.id,
      name: zone.name,
      city: zone.city,
      region: zone.region,
      active: zone.active,
      baseFee: String(zone.baseFee),
    })),
    pricingRules: settings.pricingRules.map((rule: PricingRuleRow) => ({
      id: rule.id,
      deliveryType: rule.deliveryType,
      baseFee: String(rule.baseFee),
      perKmFee: String(rule.perKmFee),
      codFeePercent: String(rule.codFeePercent),
      active: rule.active,
      zone: rule.zone ? { name: rule.zone.name } : null,
    })),
      }} />
    </div>
  );
}
