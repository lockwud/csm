import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "./Button";

export function IconButton({ icon, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string }) {
  return (
    <Button size="icon" variant="ghost" aria-label={label} title={label} {...props}>
      {icon}
    </Button>
  );
}
