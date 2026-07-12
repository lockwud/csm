import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { businessName: "asc" }, take: 50, include: { _count: { select: { orders: true } } } });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Clients</h1><Card><CardHeader><CardTitle>Client Accounts</CardTitle></CardHeader><CardContent className="p-0"><Table><THead><TR><TH>Business</TH><TH>Contact</TH><TH>Tier</TH><TH>Orders</TH><TH>Balance</TH></TR></THead><TBody>{clients.map((client) => <TR key={client.id}><TD className="font-bold">{client.businessName}</TD><TD>{client.contactName}<p className="text-xs text-text-muted">{client.phone}</p></TD><TD>{client.tier}</TD><TD>{client._count.orders}</TD><TD>{formatCurrency(String(client.outstandingBalance))}</TD></TR>)}</TBody></Table></CardContent></Card></div>;
}
