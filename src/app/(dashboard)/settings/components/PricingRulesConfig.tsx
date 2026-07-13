import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/formatCurrency";

export function PricingRulesConfig({ rules }: { rules: Array<{ id: string; deliveryType: string; baseFee: unknown; perKmFee: unknown; codFeePercent: unknown; active: boolean; zone: { name: string } | null }> }) {
  return (
    <Card>
      <CardHeader><CardTitle>Pricing Rules Configuration</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {rules.map((rule) => <div key={rule.id} className="rounded-md bg-slate-50 p-3"><strong>{rule.zone?.name ?? "All zones"} · {rule.deliveryType.replaceAll("_", " ")}</strong><p className="text-sm text-text-muted">Base {formatCurrency(String(rule.baseFee))} · Per km {formatCurrency(String(rule.perKmFee))} · COD {String(rule.codFeePercent)}%</p></div>)}
      </CardContent>
    </Card>
  );
}
