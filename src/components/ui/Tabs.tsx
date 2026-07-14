export function Tabs({ items, active }: { items: string[]; active?: string }) {
  return (
    <div className="flex gap-1 rounded-md bg-slate-100 p-1">
      {items.map((item: string) => (
        <button key={item} className={item === active ? "rounded bg-white px-3 py-2 text-sm font-bold shadow-sm" : "px-3 py-2 text-sm text-text-muted"}>
          {item}
        </button>
      ))}
    </div>
  );
}
