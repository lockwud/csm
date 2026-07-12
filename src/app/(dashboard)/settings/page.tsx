import { ExpressConfigModal } from "./components/ExpressConfigModal";
import { DeliveryZonesConfig } from "./components/DeliveryZonesConfig";
import { OrderTypesConfig } from "./components/OrderTypesConfig";
import { PackageTypesConfig } from "./components/PackageTypesConfig";
import { PaymentMethodsConfig } from "./components/PaymentMethodsConfig";
import { PricingRulesConfig } from "./components/PricingRulesConfig";
import { ServiceZonesConfig } from "./components/ServiceZonesConfig";
import { getSettings } from "@/lib/services/settingsService";

function categoryItems(data: Awaited<ReturnType<typeof getSettings>>, name: string) {
  return data.categories.find((category) => category.name === name)?.items ?? [];
}

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div><h1 className="text-2xl font-bold">Settings & Configuration</h1><p className="text-sm text-text-muted">Operational lists, service zones, and pricing rules.</p></div>
        <ExpressConfigModal />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <OrderTypesConfig items={categoryItems(settings, "order-types")} />
        <PackageTypesConfig items={categoryItems(settings, "package-types")} />
        <DeliveryZonesConfig items={categoryItems(settings, "delivery-zones")} />
        <PaymentMethodsConfig items={categoryItems(settings, "payment-methods")} />
        <ServiceZonesConfig zones={settings.serviceZones} />
        <PricingRulesConfig rules={settings.pricingRules} />
      </div>
    </div>
  );
}
