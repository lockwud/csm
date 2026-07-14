import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function money(amount: unknown, currency = "GHS") {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

type ClientPaymentRow = {
  id: string;
  reference: string;
  amount: unknown;
  currency: string;
  provider: string;
  channel: string;
  status: string;
  order: { waybill: string; trackingCode: string } | null;
};

export default async function ClientPaymentsPage() {
  const user = await requireUser();
  const payments = user?.clientId ? await prisma.paymentIntent.findMany({
    where: { clientId: user.clientId },
    include: { order: true, checkoutSessions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 80,
  }) : [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">Payment History</h1>
        <p className="mt-1 text-sm text-text-muted">Review Paystack checkout attempts, split payments, and paid delivery fees.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-bold">Transactions</h2>
        </div>
        <div className="divide-y divide-border">
          {(payments as ClientPaymentRow[]).map((payment: ClientPaymentRow) => (
            <article key={payment.id} className="grid gap-3 p-4 md:grid-cols-[1fr_180px_160px] md:items-center">
              <div>
                <p className="font-black">{payment.reference}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {payment.order ? <Link href={`/track/${payment.order.trackingCode}`} className="text-brand">{payment.order.waybill}</Link> : "No order linked"}
                </p>
                <p className="text-xs text-text-muted">{payment.provider} · {payment.channel.replaceAll("_", " ")}</p>
              </div>
              <div className="font-black">{money(payment.amount, payment.currency)}</div>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-black text-brand">
                <CreditCard className="h-3.5 w-3.5" />
                {payment.status}
              </span>
            </article>
          ))}
          {!payments.length ? <p className="p-6 text-sm text-text-muted">No payments yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
