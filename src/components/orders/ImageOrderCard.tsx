import { ImageIcon, Phone } from "lucide-react";
import { ImageOrder } from "@/lib/types";
import { Pill } from "@/components/ui/Badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImageOrderCard({ order }: { order: ImageOrder }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-background text-text-muted">
            <ImageIcon size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{order.label}</p>
            <p className="text-[11px] text-text-muted">
              {order.submittedBy} · {formatDate(order.submittedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Pill>{order.itemCount} items</Pill>
          <button className="rounded-2xl bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
            Process order
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: Math.min(order.itemCount, 2) }).map((_: unknown, index: number) => (
          <div key={index} className="relative flex h-24 items-center justify-center rounded-3xl border border-border bg-slate-100 text-text-muted">
            <ImageIcon size={20} />
            {index === 1 && order.itemCount > 2 && (
              <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-semibold text-white">
                +{order.itemCount - 2}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
        <Phone size={12} />
        Sender phone: {order.senderPhone}
      </div>
    </div>
  );
}
