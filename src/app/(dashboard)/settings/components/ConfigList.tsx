import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";

type Item = { id: string; label: string; active: boolean; value?: unknown };

export function ConfigList({ title, items, addLabel }: { title: string; items: Item[]; addLabel: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm">{addLabel}</Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
            <div>
              <strong>{item.label}</strong>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={item.active ? "success" : "secondary"}>{item.active ? "Active" : "Inactive"}</Badge>
                <Switch checked={item.active} />
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" aria-label={`Edit ${item.label}`}><Edit className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Delete ${item.label}`}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
