"use client";

import { useState } from "react";
import { Save, Settings2, X } from "lucide-react";

const ORDER_TYPES = [
  "Standard",
  "Express",
  "Same Day",
  "Scheduled",
  "Bulk Delivery",
];

export function OrderTypeConfigPage() {
  return (
    <div className="space-y-8">
      {ORDER_TYPES.map((orderType: string) => (
        <OrderTypeConfigSection key={orderType} type={orderType} />
      ))}
    </div>
  );
}

type OrderTypeConfigModalProps = {
  type: string;
  open: boolean;
  onClose: () => void;
};

export function OrderTypeConfigModal({ type, open, onClose }: OrderTypeConfigModalProps) {
  const [active, setActive] = useState(true);
  const [form, setForm] = useState({
    baseRate: "0",
    minDistance: "0",
    maxDistance: "0",
    timeLimit: "0",
  });

  if (!open) return null;

  const title = `${type} Orders Configuration`;
  const description =
    type === "Express"
      ? "Configure base rate, distance, and delivery time limits for express orders."
      : `Configure order settings for ${type.toLowerCase()} deliveries.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-1 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Settings2 size={18} className="text-text" />
            <h2 className="text-base font-semibold text-text">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-brand text-brand hover:bg-brand-light"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-5 text-sm text-text-muted">{description}</p>

        <div className="space-y-4">
          <Field
            label="Base Rate Per Distance (per km)"
            hint="The base rate charged per kilometer for this order type."
            value={form.baseRate}
            onChange={(v) => setForm({ ...form, baseRate: v })}
          />

          <Field
            label="Minimum Distance (km)"
            hint="Minimum distance threshold for this order type."
            value={form.minDistance}
            onChange={(v) => setForm({ ...form, minDistance: v })}
          />

          <Field
            label="Maximum Distance (km)"
            hint="Maximum distance allowed for this order type."
            value={form.maxDistance}
            onChange={(v) => setForm({ ...form, maxDistance: v })}
          />

          <Field
            label="Time Limit (minutes)"
            hint="Maximum delivery time for this order type."
            value={form.timeLimit}
            onChange={(v) => setForm({ ...form, timeLimit: v })}
          />

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-semibold text-text">Active</p>
              <p className="text-xs text-text-muted">
                Enable or disable this order type configuration
              </p>
            </div>

            <button
              onClick={() => setActive(!active)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                active ? "bg-brand" : "bg-border"
              }`}
              aria-pressed={active}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-6 py-2 text-sm font-semibold text-text hover:bg-background"
          >
            Cancel
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Save size={15} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderTypeConfigSection({ type }: { type: string }) {
  const [active, setActive] = useState(true);
  const [form, setForm] = useState({
    baseRate: "0",
    minDistance: "0",
    maxDistance: "0",
    timeLimit: "0",
  });

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">{type} orders</h2>
        </div>

        <button
          type="button"
          onClick={() => setActive(!active)}
          aria-pressed={active}
          aria-label={active ? `${type} orders enabled` : `${type} orders disabled`}
          className="relative h-6 w-12 rounded-full border border-border bg-slate-100"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${
              active ? "right-0.5 bg-brand" : "left-0.5 bg-white"
            }`}
          />
        </button>
      </div>

      <p className="mb-6 text-sm text-text-muted">
        Configure pricing, distance limits, and delivery timing for {type.toLowerCase()} orders.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Base Rate Per Distance (per km)"
          hint="The base rate charged per kilometer for this order type."
          value={form.baseRate}
          onChange={(v) => setForm({ ...form, baseRate: v })}
        />

        <Field
          label="Minimum Distance (km)"
          hint="Minimum distance threshold for this order type."
          value={form.minDistance}
          onChange={(v) => setForm({ ...form, minDistance: v })}
        />

        <Field
          label="Maximum Distance (km)"
          hint="Maximum distance allowed for this order type."
          value={form.maxDistance}
          onChange={(v) => setForm({ ...form, maxDistance: v })}
        />

        <Field
          label="Time Limit (minutes)"
          hint="Maximum delivery time for this order type."
          value={form.timeLimit}
          onChange={(v) => setForm({ ...form, timeLimit: v })}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
        <button
          type="button"
          className="rounded-lg border border-border px-6 py-2 text-sm font-semibold text-text hover:bg-background"
        >
          Save
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-text">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
      />
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
