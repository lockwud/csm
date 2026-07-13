import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function StatusBreakdown({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <Card>
      <CardHeader><CardTitle>Delivery Status Breakdown</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {data.map((item) => (
          <div key={item.label} className="grid grid-cols-[92px_1fr_36px] items-center gap-3 text-sm">
            <span className="text-text-muted">{item.label}</span>
            <span className="h-8 rounded bg-brand-light"><span className="block h-full rounded bg-brand" style={{ width: `${(item.value / max) * 100}%` }} /></span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
