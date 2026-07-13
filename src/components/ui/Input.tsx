import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({
  label,
  error,
  helperText,
  className,
  required,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; helperText?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-text">
      {label ? (
        <span>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </span>
      ) : null}
      <input
        className={clsx(
          "h-10 rounded-md border border-border bg-white px-3 text-sm outline-none transition placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-slate-100",
          error && "border-danger focus:border-danger focus:ring-danger/15",
          className,
        )}
        required={required}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {helperText && !error ? <span className="text-xs text-text-muted">{helperText}</span> : null}
    </label>
  );
}
