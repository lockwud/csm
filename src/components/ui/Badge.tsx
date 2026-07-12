import type { HTMLAttributes } from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  secondary: "bg-stone-100 text-stone-700",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  destructive: "bg-danger-light text-danger",
  info: "bg-brand-light text-brand",
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", variants[variant], className)} {...props} />;
}

export const Pill = Badge;
