import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export default async function SupportPage() {
  const tickets = await prisma.supportTicket.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Support</h1><Card><CardHeader><CardTitle>Tickets</CardTitle></CardHeader><CardContent className="grid gap-3">{tickets.map((ticket) => <div key={ticket.id} className="rounded-md bg-slate-50 p-3"><strong>{ticket.reference}</strong><p className="text-sm">{ticket.customer}</p><Badge variant={ticket.status === "ESCALATED" ? "destructive" : "info"}>{ticket.status.replaceAll("_", " ")}</Badge></div>)}</CardContent></Card></div>;
}
