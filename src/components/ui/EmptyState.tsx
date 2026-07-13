import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-white p-10 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-brand-light" />
      <h3 className="font-bold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
