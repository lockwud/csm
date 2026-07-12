export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="grid gap-1">
      {label ? <div className="text-xs font-semibold text-text-muted">{label}</div> : null}
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
