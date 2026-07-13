"use client";

import { useMemo, useState } from "react";
import { Bell, CreditCard, Hash, Mail, MapPin, MessageSquare, Package, Pencil, Plus, Save, Settings2, SlidersHorizontal, Smartphone, Tag, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type ConfigItem = {
  id: string;
  label: string;
  active: boolean;
  value?: unknown;
};

type ServiceZone = {
  id: string;
  name: string;
  city: string;
  region: string | null;
  active: boolean;
  baseFee: unknown;
};

type PricingRule = {
  id: string;
  deliveryType: string;
  baseFee: unknown;
  perKmFee: unknown;
  codFeePercent: unknown;
  active: boolean;
  zone: { name: string } | null;
};

type CodeRule = {
  name: string;
  namingType: string;
  prefix: string;
  minLength: number;
  maxLength: number;
  example: string;
  owner: string;
  active: boolean;
};

type NotificationChannel = {
  label: string;
  description: string;
  active: boolean;
};

type SettingsData = {
  orderTypes: ConfigItem[];
  packageTypes: ConfigItem[];
  deliveryZones: ConfigItem[];
  paymentMethods: ConfigItem[];
  codeRules?: unknown;
  notificationChannels?: unknown;
  serviceZones: ServiceZone[];
  pricingRules: PricingRule[];
};

const tabs = ["General", "Orders", "Pricing", "Delivery Zones", "Payments", "Notifications", "Codes & IDs", "Security"];

type SettingsModal = {
  title: string;
  description: string;
  fields: Array<{ label: string; value?: string; type?: string; helperText?: string }>;
  toggleLabel?: string;
  onSave?: (values: Record<string, string>) => void | Promise<void>;
};

type ConfigCollection = "order" | "package" | "delivery" | "payment";

const configEndpoints: Record<ConfigCollection, string> = {
  order: "/api/settings/order-types",
  package: "/api/settings/package-types",
  delivery: "/api/settings/delivery-zones",
  payment: "/api/settings/payment-methods",
};

const defaultCodeSettings: CodeRule[] = [
  { name: "Waybill Number", namingType: "Series", prefix: "WB/", minLength: 4, maxLength: 4, example: "WB-20260712-0001", owner: "Orders", active: true },
  { name: "Tracking Code", namingType: "Random", prefix: "SNK-", minLength: 8, maxLength: 8, example: "SNK-A1B2C3D4", owner: "Customer tracking", active: true },
  { name: "Dispatch Manifest", namingType: "Series", prefix: "MAN/", minLength: 4, maxLength: 4, example: "MAN-20260712-0001", owner: "Dispatch", active: true },
  { name: "Payment Reference", namingType: "Series", prefix: "PAY/", minLength: 4, maxLength: 4, example: "PAY-20260712-0001", owner: "Payments", active: true },
  { name: "Finance Entry", namingType: "Series", prefix: "FIN/", minLength: 4, maxLength: 4, example: "FIN-20260712-0001", owner: "Finance", active: true },
  { name: "Support Ticket", namingType: "Series", prefix: "SUP/", minLength: 4, maxLength: 4, example: "SUP-20260712-0001", owner: "Support", active: true },
  { name: "Rider Account", namingType: "Series", prefix: "RID/", minLength: 3, maxLength: 5, example: "RID-0001", owner: "Riders", active: true },
];

const defaultNotificationChannels: NotificationChannel[] = [
  { label: "In-app", description: "Dashboard and notification modal updates.", active: true },
  { label: "Push", description: "Firebase Cloud Messaging device alerts.", active: true },
  { label: "Email", description: "SMTP delivery for receipts and support.", active: true },
  { label: "SMS", description: "Twilio delivery updates and OTP messages.", active: true },
];

function asCodeRules(value: unknown): CodeRule[] {
  if (!Array.isArray(value)) return defaultCodeSettings;
  return value.filter((item) => {
    const record = typeof item === "object" && item ? item as Partial<CodeRule> : {};
    return record.name !== "Client Account" && record.name !== "Client Accounts";
  }).map((item, index) => {
    const record = typeof item === "object" && item ? item as Partial<CodeRule> : {};
    return {
      ...defaultCodeSettings[index % defaultCodeSettings.length],
      ...record,
      minLength: Number(record.minLength ?? defaultCodeSettings[index % defaultCodeSettings.length].minLength),
      maxLength: Number(record.maxLength ?? defaultCodeSettings[index % defaultCodeSettings.length].maxLength),
      active: Boolean(record.active ?? true),
    };
  });
}

function asNotificationChannels(value: unknown): NotificationChannel[] {
  if (!Array.isArray(value)) return defaultNotificationChannels;
  return value.map((item, index) => {
    const record = typeof item === "object" && item ? item as Partial<NotificationChannel> : {};
    return {
      ...defaultNotificationChannels[index % defaultNotificationChannels.length],
      ...record,
      active: Boolean(record.active ?? true),
    };
  });
}

async function saveAppSetting(key: string, label: string, value: unknown) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, label, value }),
  });
  if (!response.ok) throw new Error("Unable to save app setting.");
}

async function patchConfigurationItem(id: string, data: Partial<ConfigItem>) {
  const response = await fetch(`/api/settings/configuration-items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to save configuration item.");
}

async function postConfigurationItem(collection: ConfigCollection, data: { label: string; active?: boolean; value?: unknown }) {
  const response = await fetch(configEndpoints[collection], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to create configuration item.");
  const result = await response.json() as { data: ConfigItem };
  return result.data;
}

async function patchServiceZone(id: string, data: Partial<ServiceZone>) {
  const response = await fetch(`/api/settings/service-zones/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to save service zone.");
}

async function patchPricingRule(id: string, data: Partial<PricingRule>) {
  const response = await fetch(`/api/settings/pricing-rules/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Unable to save pricing rule.");
}

function configValues(item: ConfigItem) {
  const stored = typeof item.value === "object" && item.value ? (item.value as Record<string, unknown>) : {};
  const label = item.label.toLowerCase();
  return {
    baseRate: Number(stored.baseRate ?? (label.includes("express") ? 35 : 0)),
    minimumDistance: Number(stored.minimumDistance ?? 0),
    maximumDistance: Number(stored.maximumDistance ?? (label.includes("same") ? 20 : 0)),
    timeLimit: Number(stored.timeLimit ?? (label.includes("express") ? 90 : 0)),
  };
}

function sectionIcon(title: string) {
  if (title.includes("Order")) return <Tag className="h-4 w-4" />;
  if (title.includes("Package")) return <Package className="h-4 w-4" />;
  if (title.includes("Delivery")) return <MapPin className="h-4 w-4" />;
  if (title.includes("Payment")) return <CreditCard className="h-4 w-4" />;
  return <Settings2 className="h-4 w-4" />;
}

function ConfigSummaryCard({
  title,
  items,
  onSelect,
  onCreate,
  onEdit,
}: {
  title: string;
  items: ConfigItem[];
  onSelect?: (item: ConfigItem) => void;
  onCreate?: () => void;
  onEdit?: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-text">
          {sectionIcon(title)}
          {title}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onCreate}>Create New</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-text-muted transition hover:border-brand hover:text-brand"
          >
            {item.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function SettingsActionModal({ modal, onClose }: { modal: SettingsModal | null; onClose: () => void }) {
  async function save(formData: FormData) {
    const values = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, String(value)]));
    await modal?.onSave?.(values);
    onClose();
  }

  return (
    <Modal
      open={Boolean(modal)}
      title={modal?.title ?? "Configuration"}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="settings-action-form" leftIcon={<Save className="h-4 w-4" />}>Save Configuration</Button>
        </div>
      }
    >
      {modal ? (
        <form id="settings-action-form" action={save} className="grid gap-4">
          {modal.description ? <p className="text-sm text-text-muted">{modal.description}</p> : null}
          {modal.fields.map((field) => (
            <Input
              key={field.label}
              name={field.label}
              label={field.label}
              helperText={field.helperText}
              type={field.type ?? "text"}
              defaultValue={field.value ?? ""}
            />
          ))}
          {modal.toggleLabel ? (
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <strong className="text-sm">{modal.toggleLabel}</strong>
                <p className="text-xs text-text-muted">Enable or disable this configuration.</p>
              </div>
              <Switch checked />
            </div>
          ) : null}
        </form>
      ) : null}
    </Modal>
  );
}

function OrderConfigModal({
  item,
  onClose,
  onSave,
  onToggleActive,
}: {
  item: ConfigItem | null;
  onClose: () => void;
  onSave: (item: ConfigItem, value: Record<string, unknown>) => Promise<void> | void;
  onToggleActive: (item: ConfigItem, active: boolean) => Promise<void> | void;
}) {
  const values = item ? configValues(item) : null;

  async function save(formData: FormData) {
    if (!item) return;
    await onSave(item, {
      baseRate: Number(formData.get("baseRate") ?? 0),
      minimumDistance: Number(formData.get("minimumDistance") ?? 0),
      maximumDistance: Number(formData.get("maximumDistance") ?? 0),
      timeLimit: Number(formData.get("timeLimit") ?? 0),
    });
    onClose();
  }

  return (
    <Modal
      open={Boolean(item)}
      title={`${item?.label ?? "Order"} Orders Configuration`}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            form="order-config-form"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Configuration
          </Button>
        </div>
      }
    >
      {item && values ? (
        <form id="order-config-form" action={save} className="grid gap-4">
          <p className="text-sm text-text-muted">Configure base rate, distance, and delivery time limits for {item.label.toLowerCase()} orders.</p>
          <Input name="baseRate" label="Base Rate Per Distance (per km)" helperText="The base rate charged per kilometer for this order type." type="number" defaultValue={values.baseRate} />
          <Input name="minimumDistance" label="Minimum Distance (km)" helperText="Minimum distance threshold for this order type." type="number" defaultValue={values.minimumDistance} />
          <Input name="maximumDistance" label="Maximum Distance (km)" helperText="Maximum distance allowed for this order type." type="number" defaultValue={values.maximumDistance} />
          <Input name="timeLimit" label="Time Limit (minutes)" helperText="Maximum delivery time for this order type." type="number" defaultValue={values.timeLimit} />
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <strong className="text-sm">Active</strong>
              <p className="text-xs text-text-muted">Enable or disable this order type configuration</p>
            </div>
            <Switch checked={item.active} onChange={(active) => onToggleActive(item, active)} />
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

function OrderConfigurationPanel({ item, onEdit, onToggle }: { item: ConfigItem; onEdit: (item: ConfigItem) => void; onToggle: (active: boolean) => void }) {
  const values = configValues(item);
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{item.label} orders</h2>
          <p className="mt-4 text-sm text-text-muted">Configure pricing, distance limits, and delivery timing for {item.label.toLowerCase()} orders.</p>
        </div>
        <Switch checked={item.active} onChange={onToggle} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Base Rate Per Distance (per km)" helperText="The base rate charged per kilometer for this order type." type="number" defaultValue={values.baseRate} />
        <Input label="Minimum Distance (km)" helperText="Minimum distance threshold for this order type." type="number" defaultValue={values.minimumDistance} />
        <Input label="Maximum Distance (km)" helperText="Maximum distance allowed for this order type." type="number" defaultValue={values.maximumDistance} />
        <Input label="Time Limit (minutes)" helperText="Maximum delivery time for this order type." type="number" defaultValue={values.timeLimit} />
      </div>
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <Button variant="outline" onClick={() => onEdit(item)}>Save</Button>
      </div>
    </Card>
  );
}

function PricingView({
  serviceZones,
  pricingRules,
  onModal,
  onCreateRule,
  onToggleRule,
}: Pick<SettingsData, "serviceZones" | "pricingRules"> & {
  onModal: (modal: SettingsModal) => void;
  onCreateRule: (values: Record<string, string>) => void | Promise<void>;
  onToggleRule: (rule: PricingRule, active: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal className="h-4 w-4" /> Pricing Rules</h2>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onModal({
              title: "Create Pricing Rule",
              description: "Configure a new zone-based pricing rule for an order type.",
              fields: [
                { label: "Zone", value: "Accra" },
                { label: "Delivery Type", value: "STANDARD" },
                { label: "Base Fee", value: "25", type: "number" },
                { label: "Per Km Fee", value: "4", type: "number" },
                { label: "COD Fee Percent", value: "1.5", type: "number" },
              ],
              toggleLabel: "Active",
              onSave: onCreateRule,
            })}
          >
            Create New
          </Button>
        </div>
        <div className="grid gap-3">
          {pricingRules.map((rule) => (
            <div key={rule.id} className="rounded-md border border-border bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <strong>{rule.zone?.name ?? "All zones"} · {rule.deliveryType.replaceAll("_", " ")}</strong>
                  <p className="text-sm text-text-muted">Zone-based pricing and COD fee configuration.</p>
                </div>
                <Switch checked={rule.active} onChange={(active) => onToggleRule(rule, active)} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Input label="Base Fee" type="number" defaultValue={String(rule.baseFee)} />
                <Input label="Per Km Fee" type="number" defaultValue={String(rule.perKmFee)} />
                <Input label="COD Fee Percent" type="number" defaultValue={String(rule.codFeePercent)} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><MapPin className="h-4 w-4" /> Zone Base Fees</h2>
        <div className="grid gap-3">
          {serviceZones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
              <div>
                <strong>{zone.name}</strong>
                <p className="text-sm text-text-muted">{zone.city}, {zone.region ?? "Ghana"}</p>
              </div>
              <Badge variant={zone.active ? "info" : "secondary"}>{formatCurrency(String(zone.baseFee))}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DeliveryZonesView({
  deliveryZones,
  serviceZones,
  onModal,
  onCreateDeliveryZone,
  onCreateServiceZone,
  onToggleServiceZone,
}: {
  deliveryZones: ConfigItem[];
  serviceZones: ServiceZone[];
  onModal: (modal: SettingsModal) => void;
  onCreateDeliveryZone: (values: Record<string, string>) => void | Promise<void>;
  onCreateServiceZone: (values: Record<string, string>) => void | Promise<void>;
  onToggleServiceZone: (zone: ServiceZone, active: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <ConfigSummaryCard
        title="Delivery Zones"
        items={deliveryZones}
        onCreate={() => onModal({
          title: "Create Delivery Zone",
          description: "Add a city or regional delivery zone used by orders and dispatch.",
          fields: [
            { label: "Zone Name", value: "Tema" },
            { label: "Rate Multiplier", value: "1.0", type: "number" },
          ],
          toggleLabel: "Active",
          onSave: onCreateDeliveryZone,
        })}
        onEdit={() => onModal({
          title: "Edit Delivery Zones",
          description: "Update the visible delivery zones and their operational status.",
          fields: deliveryZones.slice(0, 5).map((item) => ({ label: item.label, value: item.label })),
        })}
      />
      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4" /> Service Zones</h2>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onModal({
              title: "Create Service Zone",
              description: "Service zones connect city, region, base fee, and pricing rules.",
              fields: [
                { label: "Name", value: "Accra Central" },
                { label: "City", value: "Accra" },
                { label: "Region", value: "Greater Accra" },
                { label: "Base Fee", value: "25", type: "number" },
              ],
              toggleLabel: "Active",
              onSave: onCreateServiceZone,
            })}
          >
            Create New
          </Button>
        </div>
        <div className="grid gap-3">
          {serviceZones.map((zone) => (
            <div key={zone.id} className="grid gap-4 rounded-md border border-border p-4 md:grid-cols-[1fr_1fr_140px_auto] md:items-center">
              <Input label="Name" defaultValue={zone.name} />
              <Input label="City / Region" defaultValue={`${zone.city}${zone.region ? `, ${zone.region}` : ""}`} />
              <Input label="Base Fee" type="number" defaultValue={String(zone.baseFee)} />
              <Switch checked={zone.active} onChange={(active) => onToggleServiceZone(zone, active)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PaymentsView({
  paymentItems,
  onModal,
  onToggle,
}: {
  paymentItems: ConfigItem[];
  onModal: (modal: SettingsModal) => void;
  onToggle: (item: ConfigItem, active: boolean) => void;
}) {
  return (
    <div className="grid gap-5">
      <ConfigSummaryCard
        title="Payment Methods"
        items={paymentItems}
        onCreate={() => onModal({
          title: "Create Payment Method",
          description: "Add a payment method available at checkout and collection.",
          fields: [
            { label: "Method Name", value: "Wallet" },
            { label: "Provider", value: "Internal" },
            { label: "Settlement Account", value: "Operations" },
          ],
          toggleLabel: "Active",
        })}
        onEdit={() => onModal({
          title: "Edit Payment Methods",
          description: "Update the names and availability of payment methods.",
          fields: paymentItems.map((item) => ({ label: item.label, value: item.label })),
        })}
      />
      <Card className="p-5">
        <h2 className="mb-5 flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Payment Method Controls</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {paymentItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-4">
              <div>
                <strong>{item.label}</strong>
                <p className="text-sm text-text-muted">Enable collection and checkout support.</p>
              </div>
              <Switch checked={item.active} onChange={(active) => onToggle(item, active)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificationsView({
  channels,
  onModal,
  onToggle,
}: {
  channels: NotificationChannel[];
  onModal: (modal: SettingsModal) => void;
  onToggle: (label: string, active: boolean) => void;
}) {
  const icons = { "In-app": Bell, Push: Smartphone, Email: Mail, SMS: MessageSquare };
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold"><Bell className="h-4 w-4" /> Notification Channels</h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => onModal({
            title: "Create Notification Rule",
            description: "Configure when and where notification messages should be sent.",
            fields: [
              { label: "Rule Name", value: "Order delivered" },
              { label: "Trigger", value: "ORDER.DELIVERED" },
              { label: "Channel", value: "In-app, Push" },
              { label: "Recipient", value: "Client" },
            ],
            toggleLabel: "Active",
          })}
        >
          Create Rule
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {channels.map((channel) => {
          const Icon = icons[channel.label as keyof typeof icons] ?? Bell;
          return (
            <div key={channel.label} className="flex items-center justify-between rounded-md border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-brand-light p-2 text-brand"><Icon className="h-4 w-4" /></span>
                <div>
                  <strong>{channel.label}</strong>
                  <p className="text-sm text-text-muted">{channel.description}</p>
                </div>
              </div>
              <Switch checked={channel.active} onChange={(active) => onToggle(channel.label, active)} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CodesIdsView({
  codeRules,
  setCodeRules,
  onModal,
}: {
  codeRules: CodeRule[];
  setCodeRules: (rules: CodeRule[]) => void;
  onModal: (modal: SettingsModal) => void;
}) {
  function openCodeModal(setting = {
    name: "Customer Invoice",
    namingType: "Series",
    prefix: "INV/",
    minLength: 4,
    maxLength: 6,
    example: "INV-20260712-0001",
    owner: "Finance",
    active: true,
  }) {
    onModal({
      title: `${setting.name} Code Settings`,
      description: "",
      fields: [
        { label: "Model Type", value: setting.name },
        { label: "Naming Type", value: setting.namingType },
        { label: "Prefix", value: setting.prefix },
        { label: "Min Length", value: String(setting.minLength), type: "number" },
        { label: "Max Length", value: String(setting.maxLength), type: "number" },
        { label: "Example", value: setting.example },
      ],
      toggleLabel: "Active",
      onSave: async (values) => {
        const nextRule: CodeRule = {
          name: values["Model Type"] || setting.name,
          namingType: values["Naming Type"] || setting.namingType,
          prefix: values.Prefix || setting.prefix,
          minLength: Number(values["Min Length"] || setting.minLength),
          maxLength: Number(values["Max Length"] || setting.maxLength),
          example: values.Example || setting.example,
          owner: setting.owner,
          active: setting.active,
        };
        const existing = codeRules.findIndex((rule) => rule.name === setting.name);
        const next = existing >= 0
          ? codeRules.map((rule, index) => index === existing ? nextRule : rule)
          : [nextRule, ...codeRules];
        setCodeRules(next);
        await saveAppSetting("code_settings", "Code Settings", next);
      },
    });
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Hash className="h-5 w-5" />
          Code Settings
        </h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => openCodeModal()}
        >
          Create New Code
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[minmax(180px,1.3fr)_minmax(100px,.8fr)_minmax(120px,.9fr)_120px_120px_110px_92px] items-center bg-brand px-4 py-3 text-sm font-bold text-white">
          <span>Model Type</span>
          <span>Naming Type</span>
          <span>Prefix</span>
          <span>Min Length</span>
          <span>Max Length</span>
          <span>Active</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto bg-white">
          {codeRules.map((setting, index) => (
            <div
              key={setting.name}
              className="mx-3 my-2 grid grid-cols-[minmax(180px,1.3fr)_minmax(100px,.8fr)_minmax(120px,.9fr)_120px_120px_110px_92px] items-center rounded-md border border-border bg-white px-4 py-3 text-sm text-text shadow-sm"
            >
              <button
                type="button"
                className="text-left font-bold hover:text-brand"
                onClick={() => openCodeModal(setting)}
              >
                {setting.name}
              </button>
              <span className="text-text-muted">{setting.namingType}</span>
              <span className="font-mono text-text-muted">{setting.prefix}</span>
              <span className="text-text-muted">{setting.minLength}</span>
              <span className="text-text-muted">{setting.maxLength}</span>
              <Switch
                checked={setting.active}
                onChange={async (active) => {
                  const next = codeRules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, active } : rule);
                  setCodeRules(next);
                  await saveAppSetting("code_settings", "Code Settings", next);
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  aria-label={`Edit ${setting.name}`}
                  onClick={() => openCodeModal(setting)}
                  className="rounded p-1 text-text-muted hover:bg-slate-100 hover:text-brand"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${setting.name}`}
                  onClick={async () => {
                    const next = codeRules.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, active: false } : rule);
                    setCodeRules(next);
                    await saveAppSetting("code_settings", "Code Settings", next);
                  }}
                  className="rounded p-1 text-danger hover:bg-danger-light"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SecurityView() {
  const [message, setMessage] = useState<string | null>(null);

  async function changePassword(formData: FormData) {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
      }),
    });

    setMessage(response.ok ? "Password changed successfully." : "Password change failed. Check your current password.");
  }

  return (
    <Card className="max-w-2xl p-5">
      <h2 className="font-bold">Change Password</h2>
      <p className="mt-1 text-sm text-text-muted">Update the password used to sign in to Sankofa Express.</p>
      <form action={changePassword} className="mt-5 grid gap-4">
        <Input label="Current Password" name="currentPassword" type="password" required />
        <Input label="New Password" name="newPassword" type="password" required helperText="Use at least 8 characters." />
        {message ? <p className="text-sm font-semibold text-brand">{message}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="h-4 w-4" />}>Change Password</Button>
        </div>
      </form>
    </Card>
  );
}

export function SettingsConfiguration({ data, initialTab }: { data: SettingsData; initialTab?: string }) {
  const normalizedInitialTab = tabs.find((tab) => tab.toLowerCase() === initialTab?.toLowerCase()) ?? "General";
  const [activeTab, setActiveTab] = useState(normalizedInitialTab);
  const [selectedOrder, setSelectedOrder] = useState<ConfigItem | null>(null);
  const [activeModal, setActiveModal] = useState<SettingsModal | null>(null);
  const [orderTypes, setOrderTypes] = useState(data.orderTypes);
  const [packageTypes, setPackageTypes] = useState(data.packageTypes);
  const [deliveryZones, setDeliveryZones] = useState(data.deliveryZones);
  const [paymentMethods, setPaymentMethods] = useState(data.paymentMethods);
  const [serviceZones, setServiceZones] = useState(data.serviceZones);
  const [pricingRules, setPricingRules] = useState(data.pricingRules);
  const [codeRules, setCodeRules] = useState(() => asCodeRules(data.codeRules));
  const [notificationChannels, setNotificationChannels] = useState(() => asNotificationChannels(data.notificationChannels));

  const paymentItems = useMemo(
    () => paymentMethods.map((item) => ({ ...item, label: item.label === "COD" ? "Cash On Delivery" : item.label })),
    [paymentMethods],
  );

  function setCollection(collection: ConfigCollection, updater: (items: ConfigItem[]) => ConfigItem[]) {
    if (collection === "order") setOrderTypes(updater);
    if (collection === "package") setPackageTypes(updater);
    if (collection === "delivery") setDeliveryZones(updater);
    if (collection === "payment") setPaymentMethods(updater);
  }

  function itemsForCollection(collection: ConfigCollection) {
    if (collection === "order") return orderTypes;
    if (collection === "package") return packageTypes;
    if (collection === "delivery") return deliveryZones;
    return paymentMethods;
  }

  async function toggleConfigItem(collection: ConfigCollection, item: ConfigItem, active: boolean) {
    const update = (items: ConfigItem[]) => items.map((entry) => entry.id === item.id ? { ...entry, active } : entry);
    setCollection(collection, update);
    setSelectedOrder((current) => current?.id === item.id ? { ...current, active } : current);
    await patchConfigurationItem(item.id, { active });
  }

  async function createConfigItem(collection: ConfigCollection, label: string, value?: unknown) {
    const item = await postConfigurationItem(collection, { label, value, active: true });
    setCollection(collection, (items) => [...items, item]);
  }

  async function createDeliveryZoneConfig(values: Record<string, string>) {
    await createConfigItem("delivery", values["Zone Name"], { rateMultiplier: Number(values["Rate Multiplier"] || 1) });
  }

  async function renameConfigItems(collection: ConfigCollection, values: Record<string, string>) {
    const items = itemsForCollection(collection);
    const next = items.map((item) => ({ ...item, label: values[item.label]?.trim() || item.label }));
    setCollection(collection, () => next);
    await Promise.all(next.map((item) => patchConfigurationItem(item.id, { label: item.label })));
  }

  async function saveOrderConfig(item: ConfigItem, value: Record<string, unknown>) {
    const next = orderTypes.map((entry) => entry.id === item.id ? { ...entry, value } : entry);
    setOrderTypes(next);
    await patchConfigurationItem(item.id, { value });
  }

  async function createServiceZone(values: Record<string, string>) {
    const response = await fetch("/api/settings/service-zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.Name,
        city: values.City,
        region: values.Region,
        baseFee: Number(values["Base Fee"] || 0),
        active: true,
      }),
    });
    if (!response.ok) throw new Error("Unable to create service zone.");
    const result = await response.json() as { data: ServiceZone };
    setServiceZones((items) => [...items, result.data]);
  }

  async function createPricingRule(values: Record<string, string>) {
    const zone = serviceZones.find((entry) => entry.name.toLowerCase() === values.Zone?.toLowerCase());
    const deliveryType = (values["Delivery Type"] || "STANDARD").toUpperCase().replaceAll(" ", "_");
    const response = await fetch("/api/settings/pricing-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zoneId: zone?.id,
        deliveryType,
        baseFee: Number(values["Base Fee"] || 0),
        perKmFee: Number(values["Per Km Fee"] || 0),
        codFeePercent: Number(values["COD Fee Percent"] || 0),
        active: true,
      }),
    });
    if (!response.ok) throw new Error("Unable to create pricing rule.");
    const result = await response.json() as { data: PricingRule };
    setPricingRules((items) => [{ ...result.data, zone: zone ? { name: zone.name } : null }, ...items]);
  }

  async function toggleServiceZone(zone: ServiceZone, active: boolean) {
    setServiceZones((items) => items.map((entry) => entry.id === zone.id ? { ...entry, active } : entry));
    await patchServiceZone(zone.id, { active });
  }

  async function togglePricingRule(rule: PricingRule, active: boolean) {
    setPricingRules((items) => items.map((entry) => entry.id === rule.id ? { ...entry, active } : entry));
    await patchPricingRule(rule.id, { active });
  }

  async function toggleNotificationChannel(label: string, active: boolean) {
    const next = notificationChannels.map((channel) => channel.label === label ? { ...channel, active } : channel);
    setNotificationChannels(next);
    await saveAppSetting("notification_channels", "Notification Channels", next);
  }

  return (
    <div className="grid gap-5">
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-background px-4 pt-4 md:-mx-6 md:-mt-6 md:px-6 md:pt-6">
        <div>
          <h1 className="text-2xl font-bold">Settings & Configuration</h1>
          <p className="mt-1 text-sm text-text-muted">Configure courier operations</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 border-b border-border text-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "border-b-2 border-brand pb-3 font-bold text-brand" : "pb-3 font-semibold text-text-muted hover:text-text"}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "General" ? (
        <div className="grid gap-5">
          <ConfigSummaryCard
            title="Order Types"
            items={orderTypes}
            onSelect={setSelectedOrder}
            onCreate={() => setActiveModal({
              title: "Create Order Type",
              description: "Add a new delivery order type and configure its default limits.",
              fields: [
                { label: "Order Type Name", value: "Weekend" },
                { label: "Base Rate Per Distance", value: "0", type: "number" },
                { label: "Time Limit", value: "0", type: "number" },
              ],
              toggleLabel: "Active",
              onSave: (values) => createConfigItem("order", values["Order Type Name"], {
                baseRate: Number(values["Base Rate Per Distance"] || 0),
                timeLimit: Number(values["Time Limit"] || 0),
              }),
            })}
            onEdit={() => setSelectedOrder(orderTypes[0] ?? null)}
          />
          <ConfigSummaryCard
            title="Package Types"
            items={packageTypes}
            onSelect={(item) => setActiveModal({
              title: `${item.label} Package Configuration`,
              description: "Configure package handling instructions and availability.",
              fields: [
                { label: "Package Type", value: item.label },
                { label: "Handling Instructions", value: item.label === "Fragile" ? "Handle with care" : "Standard handling" },
              ],
              toggleLabel: "Active",
              onSave: (values) => patchConfigurationItem(item.id, { label: values["Package Type"], value: { handlingInstructions: values["Handling Instructions"] } }),
            })}
            onCreate={() => setActiveModal({
              title: "Create Package Type",
              description: "Add a package type used when creating orders.",
              fields: [
                { label: "Package Type", value: "Medical" },
                { label: "Handling Instructions", value: "Keep upright" },
              ],
              toggleLabel: "Active",
              onSave: (values) => createConfigItem("package", values["Package Type"], { handlingInstructions: values["Handling Instructions"] }),
            })}
            onEdit={() => setActiveModal({
              title: "Edit Package Types",
              description: "Update configured package type labels.",
              fields: packageTypes.map((item) => ({ label: item.label, value: item.label })),
              onSave: (values) => renameConfigItems("package", values),
            })}
          />
          <ConfigSummaryCard
            title="Delivery Zones"
            items={deliveryZones}
            onSelect={(item) => setActiveModal({
              title: `${item.label} Zone Configuration`,
              description: "Configure zone rate multiplier and active status.",
              fields: [
                { label: "Zone Name", value: item.label },
                { label: "Rate Multiplier", value: "1.0", type: "number" },
              ],
              toggleLabel: "Active",
              onSave: (values) => patchConfigurationItem(item.id, { label: values["Zone Name"], value: { rateMultiplier: Number(values["Rate Multiplier"] || 1) } }),
            })}
            onCreate={() => setActiveModal({
              title: "Create Delivery Zone",
              description: "Add a delivery zone used for routing and pricing.",
              fields: [
                { label: "Zone Name", value: "Tema" },
                { label: "Rate Multiplier", value: "1.0", type: "number" },
              ],
              toggleLabel: "Active",
              onSave: (values) => createConfigItem("delivery", values["Zone Name"], { rateMultiplier: Number(values["Rate Multiplier"] || 1) }),
            })}
            onEdit={() => setActiveModal({
              title: "Edit Delivery Zones",
              description: "Update configured delivery zone labels.",
              fields: deliveryZones.map((item) => ({ label: item.label, value: item.label })),
              onSave: (values) => renameConfigItems("delivery", values),
            })}
          />
          <ConfigSummaryCard
            title="Payment Methods"
            items={paymentItems}
            onSelect={(item) => setActiveModal({
              title: `${item.label} Payment Configuration`,
              description: "Configure payment method provider and availability.",
              fields: [
                { label: "Payment Method", value: item.label },
                { label: "Provider", value: item.label.includes("Mobile") ? "Mobile Money" : item.label },
              ],
              toggleLabel: "Active",
              onSave: (values) => patchConfigurationItem(item.id, { label: values["Payment Method"], value: { provider: values.Provider } }),
            })}
            onCreate={() => setActiveModal({
              title: "Create Payment Method",
              description: "Add a payment method available to clients.",
              fields: [
                { label: "Payment Method", value: "Wallet" },
                { label: "Provider", value: "Internal" },
              ],
              toggleLabel: "Active",
              onSave: (values) => createConfigItem("payment", values["Payment Method"], { provider: values.Provider }),
            })}
            onEdit={() => setActiveModal({
              title: "Edit Payment Methods",
              description: "Update configured payment methods.",
              fields: paymentItems.map((item) => ({ label: item.label, value: item.label })),
              onSave: (values) => renameConfigItems("payment", values),
            })}
          />
        </div>
      ) : null}

      {activeTab === "Orders" ? (
        <div className="grid gap-5">
          {orderTypes.map((item) => (
            <OrderConfigurationPanel key={item.id} item={item} onEdit={setSelectedOrder} onToggle={(active) => toggleConfigItem("order", item, active)} />
          ))}
        </div>
      ) : null}

      {activeTab === "Pricing" ? (
        <PricingView serviceZones={serviceZones} pricingRules={pricingRules} onModal={setActiveModal} onCreateRule={createPricingRule} onToggleRule={togglePricingRule} />
      ) : null}

      {activeTab === "Delivery Zones" ? (
        <DeliveryZonesView
          deliveryZones={deliveryZones}
          serviceZones={serviceZones}
          onModal={setActiveModal}
          onCreateDeliveryZone={createDeliveryZoneConfig}
          onCreateServiceZone={createServiceZone}
          onToggleServiceZone={toggleServiceZone}
        />
      ) : null}

      {activeTab === "Payments" ? <PaymentsView paymentItems={paymentItems} onModal={setActiveModal} onToggle={(item, active) => toggleConfigItem("payment", item, active)} /> : null}

      {activeTab === "Codes & IDs" ? <CodesIdsView codeRules={codeRules} setCodeRules={setCodeRules} onModal={setActiveModal} /> : null}

      {activeTab === "Notifications" ? <NotificationsView channels={notificationChannels} onModal={setActiveModal} onToggle={toggleNotificationChannel} /> : null}

      {activeTab === "Security" ? <SecurityView /> : null}

      <OrderConfigModal item={selectedOrder} onClose={() => setSelectedOrder(null)} onSave={saveOrderConfig} onToggleActive={(item, active) => toggleConfigItem("order", item, active)} />
      <SettingsActionModal modal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
