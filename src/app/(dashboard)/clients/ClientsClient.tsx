"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type ClientRow = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  tier: string;
  outstandingBalance: string | number;
  _count?: { orders: number };
};

type ApiResult = { ok: true; data: ClientRow[] } | { ok: false; error: string };

export function ClientsClient() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/clients", { cache: "no-store" })
      .then((response) => response.json() as Promise<ApiResult>)
      .then((result) => {
        if (!active) return;
        if (result.ok) setClients(result.data);
        else setError(result.error);
      })
      .catch(() => {
        if (active) setError("Connection is unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="mt-1 text-sm text-text-muted">Customer and business courier profiles used for orders, billing, and support.</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">A client may have a user login, but this table is the operational customer record.</p>
        </div>
        {loading ? <span className="text-xs font-bold text-brand">Loading API...</span> : null}
      </div>
      {error ? <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold">{error}</div> : null}
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead><TR><TH>Business</TH><TH>Contact</TH><TH>Tier</TH><TH>Orders</TH><TH>Balance</TH></TR></THead>
            <TBody>
              {clients.map((client) => (
                <TR key={client.id}>
                  <TD className="font-bold">{client.businessName}</TD>
                  <TD>{client.contactName}<p className="text-xs text-text-muted">{client.phone}</p></TD>
                  <TD>{client.tier}</TD>
                  <TD>{client._count?.orders ?? 0}</TD>
                  <TD>{formatCurrency(String(client.outstandingBalance))}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
