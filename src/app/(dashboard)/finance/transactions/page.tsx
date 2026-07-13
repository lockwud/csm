import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default async function TransactionsPage() {
  const payments = await prisma.paymentIntent.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Transactions</h1><Card><CardHeader><CardTitle>Payment Intents</CardTitle></CardHeader><CardContent className="grid gap-3">{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3"><strong>{payment.reference}</strong><span>{formatCurrency(String(payment.amount))}</span><span>{payment.status}</span></div>)}</CardContent></Card></div>;
}
