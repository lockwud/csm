import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function DeliveryTrendChart({ data }: { data: Array<{ label: string; shipments: number; delivered: number }> }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.shipments, item.delivered]));
  return (
    <Card>
      <CardHeader><CardTitle>Delivery Trend</CardTitle></CardHeader>
      <CardContent className="flex h-72 items-end gap-4">
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-56 items-end gap-1">
              <span className="w-6 rounded-t bg-brand" style={{ height: `${(item.shipments / max) * 100}%` }} />
              <span className="w-6 rounded-t bg-success" style={{ height: `${(item.delivered / max) * 100}%` }} />
            </div>
            <span className="text-xs text-text-muted">{item.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
