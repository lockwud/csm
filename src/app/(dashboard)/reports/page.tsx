import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const templates = await prisma.reportTemplate.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Reports</h1><Card><CardHeader><CardTitle>Templates</CardTitle></CardHeader><CardContent className="grid gap-2">{templates.map((template) => <p key={template.id} className="rounded-md bg-slate-50 p-3">{template.name} · {template.type} · {template.format}</p>)}</CardContent></Card></div>;
}
