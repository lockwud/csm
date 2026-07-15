"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, FileText, MessageSquareReply, PackageCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Owner = { id: string; name: string; email: string };
type Ticket = {
  id: string;
  reference: string;
  customer: string;
  channel: string;
  category: string;
  priority: string;
  status: string;
  lastUpdate: string | null;
  openedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  client: { id: string; businessName: string; contactName: string; phone: string; email: string | null; tier: string } | null;
  owner: Owner | null;
  order: {
    id: string;
    waybill: string;
    trackingCode: string;
    status: string;
    city: string;
    senderAddress: { name: string; phone: string; city: string; addressLine1: string };
    receiverAddress: { name: string; phone: string; city: string; addressLine1: string };
  } | null;
};
type TicketsResult = { ok: true; data: Ticket[] } | { ok: false; error: string };

const statuses = ["OPEN", "WAITING_CUSTOMER", "ESCALATED", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function badgeVariant(status: string) {
  if (status === "RESOLVED" || status === "CLOSED") return "success" as const;
  if (status === "ESCALATED") return "destructive" as const;
  if (status === "WAITING_CUSTOMER") return "warning" as const;
  return "info" as const;
}

function SoftDropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  label: string;
}) {
  const current = options.find((option) => option.value === value)?.label ?? value;
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {label}
      <details className="group relative">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg bg-slate-100 px-3 text-sm font-bold text-text shadow-sm ring-1 ring-border hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
          <span className="truncate">{current}</span>
          <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                onChange(option.value);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className={option.value === value ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}
            >
              <Check className={option.value === value ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              {option.label}
            </button>
          ))}
        </div>
      </details>
    </label>
  );
}

export function SupportDeskClient({ initialTickets, owners }: { initialTickets: Ticket[]; owners: Owner[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedId, setSelectedId] = useState(initialTickets[0]?.id ?? "");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loadingTickets, setLoadingTickets] = useState(false);
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null;

  function changeFilter(value: string) {
    setStatusFilter(value);
  }

  async function loadTickets(filter = statusFilter, preferredId = selectedId) {
    setLoadingTickets(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    const response = await fetch(`/api/support${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
    const result = await response.json() as TicketsResult;
    setLoadingTickets(false);
    if (!result.ok) return;
    setTickets(result.data);
    const nextSelected = result.data.find((ticket) => ticket.id === preferredId) ?? result.data[0];
    setSelectedId(nextSelected?.id ?? "");
  }

  useEffect(() => {
    let active = true;
    async function run() {
      setLoadingTickets(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await fetch(`/api/support${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
      const result = await response.json() as TicketsResult;
      if (!active) return;
      setLoadingTickets(false);
      if (!result.ok) return;
      setTickets(result.data);
      setSelectedId((current) => (result.data.find((ticket) => ticket.id === current) ?? result.data[0])?.id ?? "");
    }
    run().catch(() => {
      if (active) setLoadingTickets(false);
    });
    return () => {
      active = false;
    };
  }, [statusFilter]);

  async function patchTicket(ticket: Ticket, payload: Record<string, unknown>) {
    setSaving(true);
    const response = await fetch(`/api/support/${ticket.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSaving(false);
    if (result.ok) await loadTickets(statusFilter, ticket.id);
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    await patchTicket(selected, { lastUpdate: `Admin reply: ${reply.trim()}`, status: "WAITING_CUSTOMER" });
    setReply("");
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-text-muted">Reply to client complaints, review linked records, assign owners, and resolve tickets.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Tickets</CardTitle>
              {loadingTickets ? <span className="text-xs font-bold text-brand">Loading...</span> : null}
              <div className="w-40">
                <SoftDropdown
                  label="Filter"
                  value={statusFilter}
                  options={[
                    { label: "All", value: "ALL" },
                    { label: "Pending", value: "PENDING" },
                    ...statuses.map((status) => ({ label: status.replaceAll("_", " "), value: status })),
                  ]}
                  onChange={changeFilter}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[620px] overflow-y-auto p-0">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={ticket.id === selected?.id ? "grid w-full gap-2 border-b border-border bg-brand-light p-4 text-left" : "grid w-full gap-2 border-b border-border p-4 text-left hover:bg-slate-50"}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{ticket.reference}</strong>
                  <Badge variant={badgeVariant(ticket.status)}>{ticket.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-sm text-text-muted">{ticket.customer}</p>
                <p className="line-clamp-2 text-xs text-text-muted">{ticket.lastUpdate ?? "Ticket opened"}</p>
              </button>
            ))}
            {!tickets.length ? <p className="p-5 text-sm text-text-muted">No tickets match this filter.</p> : null}
          </CardContent>
        </Card>

        {selected ? (
          <div className="grid gap-5">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{selected.reference}</CardTitle>
                    <p className="mt-1 text-sm text-text-muted">{selected.category.replaceAll("_", " ")} · {selected.channel}</p>
                  </div>
                  <Badge variant={badgeVariant(selected.status)}>{selected.status.replaceAll("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <SoftDropdown label="Status" value={selected.status} options={statuses.map((status) => ({ label: status.replaceAll("_", " "), value: status }))} onChange={(status) => patchTicket(selected, { status })} />
                  <SoftDropdown label="Priority" value={selected.priority} options={priorities.map((priority) => ({ label: priority, value: priority }))} onChange={(priority) => patchTicket(selected, { priority })} />
                  <SoftDropdown label="Owner" value={selected.owner?.id ?? ""} options={[{ label: "Unassigned", value: "" }, ...owners.map((owner) => ({ label: owner.name, value: owner.id }))]} onChange={(ownerId) => patchTicket(selected, { ownerId: ownerId || null })} />
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-brand">Latest update</p>
                  <p className="mt-2 text-sm">{selected.lastUpdate ?? "Ticket opened"}</p>
                </div>
                <label className="grid gap-2 text-sm font-semibold">
                  Admin Reply
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} className="rounded-lg border border-border bg-white px-3 py-3 text-sm outline-none focus:border-brand" placeholder="Type the response or internal action taken." />
                </label>
                <div className="flex flex-wrap justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => patchTicket(selected, { status: "ESCALATED", lastUpdate: "Ticket escalated for admin review." })}>Escalate</Button>
                  <Button type="button" variant="outline" onClick={() => patchTicket(selected, { status: "OPEN", lastUpdate: "Ticket reopened." })}>Reopen</Button>
                  <Button type="button" variant="success" onClick={() => patchTicket(selected, { status: "RESOLVED", lastUpdate: "Ticket resolved by support." })}>Mark Resolved</Button>
                  <Button type="button" loading={saving} leftIcon={<MessageSquareReply className="h-4 w-4" />} onClick={sendReply}>Send Reply</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Client Record</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  <p><strong>Customer:</strong> {selected.customer}</p>
                  <p><strong>Client:</strong> {selected.client?.businessName ?? "No linked client"}</p>
                  <p><strong>Contact:</strong> {selected.client?.contactName ?? "-"}</p>
                  <p><strong>Phone:</strong> {selected.client?.phone ?? "-"}</p>
                  <p><strong>Email:</strong> {selected.client?.email ?? "-"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-brand" /> Order Reference</CardTitle></CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {selected.order ? (
                    <>
                      <p><strong>Waybill:</strong> <Link href={`/orders/${selected.order.id}`} className="text-brand">{selected.order.waybill}</Link></p>
                      <p><strong>Tracking:</strong> <Link href={`/track/${selected.order.trackingCode}`} className="text-brand">{selected.order.trackingCode}</Link></p>
                      <p><strong>Status:</strong> {selected.order.status.replaceAll("_", " ")}</p>
                      <p><strong>Route:</strong> {selected.order.senderAddress.city} to {selected.order.receiverAddress.city}</p>
                    </>
                  ) : <p className="text-text-muted">No order linked to this support ticket.</p>}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-brand" /> Support Documents & References</CardTitle></CardHeader>
              <CardContent className="grid gap-2 text-sm text-text-muted">
                <p>Current schema stores ticket notes and linked order/client references. File attachments are not yet a separate database model.</p>
                <p>Use the linked order, tracking code, client record, and latest update as the support evidence for this version.</p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
