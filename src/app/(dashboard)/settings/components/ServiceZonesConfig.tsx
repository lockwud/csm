import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function ServiceZonesConfig({ zones }: { zones: Array<{ id: string; name: string; city: string; region: string | null; baseFee: unknown; active: boolean }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Service Zones Configuration</CardTitle><Button size="sm">Add service zone</Button></CardHeader>
      <CardContent className="grid gap-3">
        {zones.map((zone) => <div key={zone.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3"><div><strong>{zone.name}</strong><p className="text-sm text-text-muted">{zone.city}, {zone.region ?? "Greater Accra"} · {formatCurrency(String(zone.baseFee))}</p><Badge variant={zone.active ? "success" : "secondary"}>{zone.active ? "Active" : "Inactive"}</Badge></div><div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Edit ${zone.name}`}><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${zone.name}`}><Trash2 className="h-4 w-4" /></Button></div></div>)}
      </CardContent>
    </Card>
  );
}
