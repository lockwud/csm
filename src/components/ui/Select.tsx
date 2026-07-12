import type { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Select({ label, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: Array<{ label: string; value: string }> }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-text">
      {label}
      <select className={clsx("h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15", className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
