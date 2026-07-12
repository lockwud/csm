import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default async function FinancePage() {
  const entries = await prisma.financeEntry.findMany({ orderBy: { date: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Finance</h1><Card><CardHeader><CardTitle>Finance Entries</CardTitle></CardHeader><CardContent className="p-0"><Table><THead><TR><TH>Reference</TH><TH>Party</TH><TH>Type</TH><TH>Amount</TH><TH>Status</TH></TR></THead><TBody>{entries.map((entry) => <TR key={entry.id}><TD className="font-bold">{entry.reference}</TD><TD>{entry.party}</TD><TD>{entry.type.replaceAll("_", " ")}</TD><TD>{formatCurrency(String(entry.amount))}</TD><TD>{entry.status}</TD></TR>)}</TBody></Table></CardContent></Card></div>;
}
