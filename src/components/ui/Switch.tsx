"use client";

import { clsx } from "clsx";

export function Switch({ checked, label, onChange }: { checked: boolean; label?: string; onChange?: (checked: boolean) => void }) {
  return (
    <button type="button" className="inline-flex items-center gap-2 text-sm" onClick={() => onChange?.(!checked)} aria-pressed={checked}>
      <span className={clsx("relative h-6 w-11 rounded-full transition", checked ? "bg-success" : "bg-slate-300")}>
        <span className={clsx("absolute top-1 h-4 w-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
      {label}
    </button>
  );
}
