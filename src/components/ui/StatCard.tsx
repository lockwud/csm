import type { ReactNode } from "react";
import { Card } from "./Card";

export function StatCard({
  title,
  value,
  icon,
  details,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  details?: Array<{ label: string; value: string | number }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text">{value}</p>
        </div>
        {icon ? <div className="rounded-md bg-brand-light p-2 text-brand">{icon}</div> : null}
      </div>
      {details?.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {details.map((item) => (
            <div key={item.label} className="rounded-md bg-slate-50 p-2">
              <p className="text-text-muted">{item.label}</p>
              <p className="font-bold text-text">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
