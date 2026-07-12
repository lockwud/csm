import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export default async function ImageOrdersPage() {
  const imageOrders = await prisma.imageOrder.findMany({ orderBy: { submittedAt: "desc" }, include: { images: true }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Image Orders</h1><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{imageOrders.map((item) => <Card key={item.id}><CardHeader><CardTitle>{item.label}</CardTitle></CardHeader><CardContent><p className="text-sm text-text-muted">{item.submittedBy} · {item.senderPhone}</p><p className="mt-2">{item.itemCount} items · {item.status}</p></CardContent></Card>)}</div></div>;
}
