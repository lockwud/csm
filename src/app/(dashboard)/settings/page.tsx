import { SettingsConfiguration } from "./components/SettingsConfiguration";
import { getSettings } from "@/lib/services/settingsService";

function categoryItems(data: Awaited<ReturnType<typeof getSettings>>, name: string) {
  return (data.categories.find((category) => category.name === name)?.items ?? []).map((item) => ({
    id: item.id,
    label: item.label,
    active: item.active,
    value: item.value,
  }));
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const settings = await getSettings();
  const appSettingValue = (key: string) => settings.appSettings.find((setting) => setting.key === key)?.value;

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
    serviceZones: settings.serviceZones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      city: zone.city,
      region: zone.region,
      active: zone.active,
      baseFee: String(zone.baseFee),
    })),
    pricingRules: settings.pricingRules.map((rule) => ({
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
