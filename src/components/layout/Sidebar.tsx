import Link from "next/link";
import { BarChart3, Bike, Boxes, CircleDollarSign, ClipboardList, Headphones, LayoutDashboard, MapPinned, Settings, Users } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/dispatch", label: "Dispatch", icon: MapPinned },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
  { href: "/image-orders", label: "Image Orders", icon: Boxes },
  { href: "/riders", label: "Riders", icon: Bike },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-border bg-white px-4 py-5 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-brand text-lg font-black text-white">S</span>
        <span>
          <strong className="block leading-tight">Sankofa Express</strong>
          <span className="text-xs text-text-muted">Courier Management</span>
        </span>
      </Link>
      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand">
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
