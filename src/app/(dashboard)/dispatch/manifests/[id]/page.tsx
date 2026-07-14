import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

type ManifestStop = {
  id: string;
  sequence: number;
  status: string;
  order: { waybill: string };
};

export default async function ManifestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = await prisma.dispatchManifest.findUnique({ where: { id }, include: { rider: true, stops: { include: { order: true }, orderBy: { sequence: "asc" } } } });
  if (!manifest) notFound();
  const stops = manifest.stops as ManifestStop[];
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">{manifest.code}</h1><Card><CardHeader><CardTitle>Stops</CardTitle></CardHeader><CardContent className="grid gap-3">{stops.map((stop: ManifestStop) => <div key={stop.id} className="rounded-md bg-slate-50 p-3"><strong>#{stop.sequence} {stop.order.waybill}</strong><p className="text-sm text-text-muted">{stop.status}</p></div>)}</CardContent></Card></div>;
}
