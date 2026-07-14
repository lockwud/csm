"use client";

import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";

type SupportOrder = {
  id: string;
  label: string;
};
type SelectOption = { label: string; value: string };

type SupportTicketRow = {
  id: string;
  reference: string;
  category: string;
  priority: string;
  status: string;
  lastUpdate: string | null;
  updatedAt: string | Date;
};

function SoftSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option: SelectOption) => option.value === value)?.label ?? value;
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input type="hidden" name={name} value={value} />
      <details className="group relative">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg bg-slate-100 px-3 text-sm font-bold text-text transition hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
          <span className="truncate">{selected}</span>
          <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-52 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl">
          {options.map((option: SelectOption) => (
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

export function PortalSupportClient({
  customer,
  clientId,
  orders,
  tickets,
}: {
  customer: string;
  clientId?: string | null;
  orders: SupportOrder[];
  tickets: SupportTicketRow[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");

  async function submitSupport(formData: FormData) {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        clientId: clientId || undefined,
        orderId: String(formData.get("orderId") || "") || undefined,
        category: formData.get("category"),
        priority: formData.get("priority"),
        lastUpdate: String(formData.get("lastUpdate") || ""),
      }),
    });
    setSaving(false);
    setMessage(response.ok ? "Support ticket logged successfully." : "Unable to log support ticket.");
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-text-muted">Log delivery complaints, compliance issues, payment issues, or address changes.</p>
      </div>

      <form action={submitSupport} className="grid gap-4 rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <SoftSelect
            label="Related Order"
            name="orderId"
            value={orderId}
            onChange={setOrderId}
            options={[{ label: "General support", value: "" }, ...orders.map((order: SupportOrder) => ({ label: order.label, value: order.id }))]}
          />
          <SoftSelect
            label="Category"
            name="category"
            value={category}
            onChange={setCategory}
            options={[
              { label: "General", value: "GENERAL" },
              { label: "Address change", value: "ADDRESS_CHANGE" },
              { label: "Delayed delivery", value: "DELAYED_DELIVERY" },
              { label: "Payment issue", value: "PAYMENT_ISSUE" },
              { label: "Damaged item", value: "DAMAGED_ITEM" },
            ]}
          />
          <SoftSelect
            label="Priority"
            name="priority"
            value={priority}
            onChange={setPriority}
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
              { label: "Urgent", value: "URGENT" },
            ]}
          />
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Complaint or request
          <textarea name="lastUpdate" required rows={6} className="rounded-lg bg-slate-100 px-3 py-3 text-sm outline-none" placeholder="Describe what happened, what you need changed, or what support should review." />
        </label>
        {message ? (
          <div className={message.startsWith("Support") ? "flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-bold text-success" : "flex items-center gap-2 rounded-lg bg-danger-light px-3 py-2 text-sm font-bold text-danger"}>
            {message.startsWith("Support") ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" loading={saving} leftIcon={<Send className="h-4 w-4" />}>Log Support Ticket</Button>
        </div>
      </form>

      <Card>
        <CardHeader><CardTitle>Support Tickets</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead><TR><TH>Reference</TH><TH>Category</TH><TH>Priority</TH><TH>Status</TH><TH>Last Update</TH></TR></THead>
            <TBody>
              {tickets.map((ticket: SupportTicketRow) => (
                <TR key={ticket.id}>
                  <TD className="font-bold text-brand">{ticket.reference}</TD>
                  <TD>{ticket.category.replaceAll("_", " ")}</TD>
                  <TD>{ticket.priority}</TD>
                  <TD><Badge variant={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "success" : ticket.status === "ESCALATED" ? "destructive" : "info"}>{ticket.status.replaceAll("_", " ")}</Badge></TD>
                  <TD>{ticket.lastUpdate ?? "Ticket opened"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {!tickets.length ? <p className="p-6 text-sm text-text-muted">No support tickets in this view.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
