import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { prisma } from "@/lib/prisma";

export default async function DispatchPage() {
  const manifests = await prisma.dispatchManifest.findMany({ include: { rider: true, _count: { select: { stops: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Dispatch</h1><Card><CardHeader><CardTitle>Manifests</CardTitle></CardHeader><CardContent className="p-0"><Table><THead><TR><TH>Code</TH><TH>Zone</TH><TH>Rider</TH><TH>Stops</TH><TH>Status</TH></TR></THead><TBody>{manifests.map((manifest) => <TR key={manifest.id}><TD><Link href={`/dispatch/manifests/${manifest.id}`} className="font-bold text-brand">{manifest.code}</Link></TD><TD>{manifest.zone}</TD><TD>{manifest.rider?.name ?? "Unassigned"}</TD><TD>{manifest._count.stops}</TD><TD><Badge variant="info">{manifest.status.replaceAll("_", " ")}</Badge></TD></TR>)}</TBody></Table></CardContent></Card></div>;
}
