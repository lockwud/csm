import { X } from "lucide-react";
import { Button } from "./Button";

export function Chip({ label, onClose }: { label: string; onClose?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
      {label}
      {onClose ? (
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={onClose} aria-label={`Remove ${label}`}>
          <X className="h-3 w-3" />
        </Button>
      ) : null}
    </span>
  );
}
