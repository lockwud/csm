import type { ReactNode } from "react";

export function DropdownMenu({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <div className="group relative inline-flex">
      {trigger}
      <div className="absolute right-0 top-full z-20 mt-2 hidden min-w-44 rounded-md border border-border bg-white p-2 shadow-lg group-hover:block">{children}</div>
    </div>
  );
}
