import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  default: "bg-brand text-white hover:bg-brand-dark",
  destructive: "bg-danger text-white hover:bg-red-700",
  outline: "border border-border bg-white text-text hover:bg-slate-50",
  secondary: "bg-slate-100 text-text hover:bg-slate-200",
  ghost: "text-text hover:bg-slate-100",
  link: "text-brand underline-offset-4 hover:underline",
  success: "bg-success text-white hover:bg-green-700",
  warning: "bg-warning text-white hover:bg-orange-700",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
