import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function ShipmentSummaryChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));
  return (
    <Card>
      <CardHeader><CardTitle>Shipment Summary</CardTitle></CardHeader>
      <CardContent>
        <div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-[28px] border-brand bg-white text-center" style={{ borderRightColor: "#12a150", borderBottomColor: "#e8820c" }}>
          <span><strong className="block text-2xl">{total}</strong><span className="text-xs text-text-muted">Shipments</span></span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          {data.map((item) => <div key={item.label} className="rounded-md bg-slate-50 p-2"><strong>{Math.round((item.value / total) * 100)}%</strong><p>{item.label}</p></div>)}
        </div>
      </CardContent>
    </Card>
  );
}
