import { clsx } from "clsx";

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
  const initials = name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  if (src) {
    return (
      <span
        aria-label={name}
        className={clsx("inline-block rounded-full bg-cover bg-center", sizes[size])}
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }
  return <span className={clsx("grid place-items-center rounded-full bg-brand text-white font-bold", sizes[size])}>{initials}</span>;
}
