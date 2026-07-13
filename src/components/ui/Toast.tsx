import { CheckCircle2, Info, XCircle } from "lucide-react";
import { clsx } from "clsx";

const styles = {
  success: {
    icon: CheckCircle2,
    wrapper: "border-success/15 bg-white",
    iconBox: "bg-success-light text-success",
  },
  info: {
    icon: Info,
    wrapper: "border-brand/15 bg-white",
    iconBox: "bg-brand-light text-brand",
  },
  warning: {
    icon: Info,
    wrapper: "border-warning/20 bg-white",
    iconBox: "bg-warning-light text-warning",
  },
  error: {
    icon: XCircle,
    wrapper: "border-danger/15 bg-danger-light/30",
    iconBox: "bg-danger-light text-danger",
  },
};

export function Toast({ title, message, variant = "info" }: { title: string; message: string; variant?: "success" | "error" | "warning" | "info" }) {
  const style = styles[variant];
  const Icon = style.icon;
  return (
    <div className={clsx("flex w-full items-start gap-3 rounded-md border p-4 shadow-lg shadow-slate-200/70", style.wrapper)}>
      <span className={clsx("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", style.iconBox)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-text">{title}</p>
        <p className="mt-1 text-xs text-text-muted">{message}</p>
      </div>
    </div>
  );
}
