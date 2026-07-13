import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={clsx("w-full border-collapse text-sm", className)} {...props} />;
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-text-muted" {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border" {...props} />;
}

export function TR(props: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="transition hover:bg-slate-50" {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={clsx("px-4 py-3 font-bold", className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("px-4 py-3 align-middle", className)} {...props} />;
}
