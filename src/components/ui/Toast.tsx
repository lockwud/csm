import { Badge } from "./Badge";

export function Toast({ title, message, variant = "info" }: { title: string; message: string; variant?: "success" | "error" | "warning" | "info" }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-lg">
      <Badge variant={variant === "error" ? "destructive" : variant}>{title}</Badge>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
    </div>
  );
}
