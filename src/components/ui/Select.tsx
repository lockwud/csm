import type { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Select({ label, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: Array<{ label: string; value: string }> }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-text">
      {label}
      <select className={clsx("h-11 rounded-xl border border-border bg-slate-50 px-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15", className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
