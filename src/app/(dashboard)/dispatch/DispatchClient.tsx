"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronDown, PackageCheck, Route } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/providers/ToastProvider";

type DispatchOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  deliveryType: string;
  city: string;
  status: string;
  createdAt: string;
  senderAddress: { city: string; name: string };
  receiverAddress: { city: string; name: string };
};

type DispatchRider = {
  id: string;
  name: string;
  zone: string;
};

type DispatchManifest = {
  id: string;
  code: string;
  zone: string;
  status: string;
  createdAt: string;
  rider: { name: string } | null;
  _count?: { stops: number };
  stops?: unknown[];
};

function formatPlacedAt(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function manifestStopCount(manifest: DispatchManifest) {
  return manifest._count?.stops ?? manifest.stops?.length ?? 0;
}

function SoftSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const selected = options.find((item) => item.value === value)?.label ?? label;
  return (
    <details className="group relative">
      <summary className="flex h-10 min-w-44 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-white px-3 text-sm font-bold text-text shadow-sm ring-1 ring-border transition hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
        <span className="truncate">{selected}</span>
        <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-30 mt-2 max-h-64 w-60 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={(event) => {
              onChange(item.value);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
            className={item.value === value ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}
          >
            <Check className={item.value === value ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export function DispatchClient({
  initialManifests,
  pendingOrders,
  riders,
}: {
  initialManifests: DispatchManifest[];
  pendingOrders: DispatchOrder[];
  riders: DispatchRider[];
}) {
  const toast = useToast();
  const [manifests, setManifests] = useState(initialManifests);
  const [orders, setOrders] = useState(pendingOrders);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const zones = useMemo(() => Array.from(new Set(orders.map((order) => order.city).filter(Boolean))).sort(), [orders]);
  const [zone, setZone] = useState(zones[0] ?? "Unassigned");
  const [riderId, setRiderId] = useState(riders[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filteredOrders = zone === "All Zones" ? orders : orders.filter((order) => order.city.toLowerCase() === zone.toLowerCase());
  const allFilteredSelected = filteredOrders.length > 0 && filteredOrders.every((order) => selectedIds.includes(order.id));

  function toggleOrder(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleFilteredOrders() {
    setSelectedIds((current) => {
      const filteredIds = filteredOrders.map((order) => order.id);
      if (allFilteredSelected) return current.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  async function createDispatch() {
    setSaving(true);
    setMessage(null);
    toast.info("Creating manifest", "Grouping selected orders for dispatch.");
    const response = await fetch("/api/dispatch/manifests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zone,
        riderId: riderId || undefined,
        orderIds: selectedIds,
      }),
    });
    const result = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok || !result?.ok) {
      setMessage(result?.error?.message ?? "Unable to create dispatch manifest.");
      toast.error("Dispatch failed", result?.error?.message ?? "Unable to create dispatch manifest.");
      return;
    }
    setManifests((current) => [result.data, ...current]);
    setOrders((current) => current.filter((order) => !selectedIds.includes(order.id)));
    setSelectedIds([]);
    setMessage(`Dispatch manifest ${result.data.code} created.`);
    toast.success("Manifest created", `${result.data.code} was created and selected orders were updated.`);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Dispatch</h1>
        <p className="mt-1 text-sm text-text-muted">Group pending orders into rider dispatch manifests.</p>
      </div>

      {message ? <p className="rounded-xl bg-white p-3 text-sm font-bold text-brand shadow-sm ring-1 ring-border">{message}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Dispatch Queue</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            <SoftSelect
              label="All Zones"
              value={zone}
              options={[{ value: "All Zones", label: "All Zones" }, ...zones.map((item) => ({ value: item, label: item }))]}
              onChange={setZone}
            />
            <SoftSelect
              label="Select Rider"
              value={riderId}
              options={[{ value: "", label: "Unassigned" }, ...riders.map((item) => ({ value: item.id, label: `${item.name} · ${item.zone}` }))]}
              onChange={setRiderId}
            />
            <Button type="button" loading={saving} disabled={!selectedIds.length || saving} leftIcon={<Route className="h-4 w-4" />} onClick={createDispatch}>
              Create Manifest
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead>
              <TR>
                <TH><input type="checkbox" checked={allFilteredSelected} onChange={toggleFilteredOrders} aria-label="Select visible orders" /></TH>
                <TH>Waybill</TH>
                <TH>Placed</TH>
                <TH>Type</TH>
                <TH>Route</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {filteredOrders.map((order) => (
                <TR key={order.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleOrder(order.id)} aria-label={`Select ${order.waybill}`} /></TD>
                  <TD><Link className="font-bold text-brand" href={`/orders/${order.id}`}>{order.waybill}</Link><p className="text-xs text-text-muted">{order.trackingCode}</p></TD>
                  <TD>{formatPlacedAt(order.createdAt)}</TD>
                  <TD>{order.deliveryType.replaceAll("_", " ")}</TD>
                  <TD>{order.senderAddress.city} to {order.receiverAddress.city}</TD>
                  <TD><Badge variant="info">{order.status.replaceAll("_", " ")}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {!filteredOrders.length ? <p className="p-6 text-sm text-text-muted">No pending orders available for dispatch.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Manifests</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead><TR><TH>Code</TH><TH>Created</TH><TH>Zone</TH><TH>Rider</TH><TH>Stops</TH><TH>Status</TH></TR></THead>
            <TBody>
              {manifests.map((manifest) => (
                <TR key={manifest.id}>
                  <TD><Link href={`/dispatch/manifests/${manifest.id}`} className="font-bold text-brand">{manifest.code}</Link></TD>
                  <TD>{formatPlacedAt(manifest.createdAt)}</TD>
                  <TD>{manifest.zone}</TD>
                  <TD>{manifest.rider?.name ?? "Unassigned"}</TD>
                  <TD>{manifestStopCount(manifest)}</TD>
                  <TD><Badge variant="info">{manifest.status.replaceAll("_", " ")}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {!manifests.length ? <p className="p-6 text-sm text-text-muted">No dispatch manifests created yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
