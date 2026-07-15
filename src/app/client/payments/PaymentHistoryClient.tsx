"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type PaymentRow = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  provider: string;
  channel: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  order: { waybill: string; trackingCode: string } | null;
};

function money(amount: number, currency = "GHS") {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

function statusVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (["FAILED", "ABANDONED"].includes(status)) return "destructive" as const;
  return "info" as const;
}

export function PaymentHistoryClient({ payments }: { payments: PaymentRow[] }) {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">Payment History</h1>
        <p className="mt-1 text-sm text-text-muted">Review Paystack checkout attempts, split payments, and paid delivery fees.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-bold">Transactions</h2>
          <p className="mt-1 text-xs text-text-muted">Click any transaction row to open its receipt.</p>
        </div>
        <div className="divide-y divide-border">
          {payments.map((payment) => (
            <Link
              key={payment.id}
              href={`/client/payments/${payment.id}/receipt`}
              className="grid gap-3 p-4 transition hover:bg-slate-50 focus:bg-brand-light/50 focus:outline-none md:grid-cols-[1fr_160px_140px] md:items-center"
            >
              <div>
                <p className="font-black">{payment.reference}</p>
                <p className="mt-1 text-sm text-brand">{payment.order?.waybill ?? "No order linked"}</p>
                <p className="text-xs text-text-muted">{payment.provider} · {payment.channel.replaceAll("_", " ")}</p>
              </div>
              <div className="font-black">{money(payment.amount, payment.currency)}</div>
              <Badge variant={statusVariant(payment.status)}><CreditCard className="mr-1 h-3.5 w-3.5" />{payment.status}</Badge>
            </Link>
          ))}
          {!payments.length ? <p className="p-6 text-sm text-text-muted">No payments yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
