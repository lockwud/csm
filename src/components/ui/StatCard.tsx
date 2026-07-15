import type { ReactNode } from "react";
import { Card } from "./Card";

type StatDetail = { label: string; value: string | number };

export function StatCard({
  title,
  value,
  icon,
  details,
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  details?: StatDetail[];
}) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-black text-text">{value}</p>
        </div>
        {icon ? <div className="rounded-md bg-brand-light p-2 text-brand">{icon}</div> : null}
      </div>
      {details?.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {details.map((item: StatDetail) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-3">
              <p className="text-text-muted">{item.label}</p>
              <p className="font-bold text-text">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
