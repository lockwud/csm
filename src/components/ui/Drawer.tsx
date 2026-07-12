import type { ReactNode } from "react";

export function Drawer({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  return <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-md bg-white p-5 shadow-xl">{children}</aside>;
}
