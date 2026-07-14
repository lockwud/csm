"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Bike, ChevronDown, CircleDollarSign, ClipboardList, Headphones, KeyRound, LayoutDashboard, MapPinned, Settings, Users } from "lucide-react";

const navItems = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/dispatch", label: "Dispatch", icon: MapPinned },
  { href: "/finance", label: "Finance", icon: CircleDollarSign },
  { href: "/riders", label: "Riders", icon: Bike },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];
type NavItem = (typeof navItems)[number];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    function handleToggle(event: Event) {
      const detail = (event as CustomEvent<{ collapsed?: boolean }>).detail;
      setCollapsed(Boolean(detail?.collapsed));
    }

    window.addEventListener("sankofa:sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sankofa:sidebar-toggle", handleToggle);
  }, []);

  return (
    <aside className={collapsed ? "hidden h-screen w-20 shrink-0 overflow-y-auto border-r border-border bg-white px-3 py-5 lg:block" : "hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-white px-4 py-5 lg:block"}>
      <div className="mb-8 flex items-center gap-2">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-brand text-lg font-black text-white">S</span>
        {!collapsed ? <span>
          <strong className="block leading-tight">Sankofa Express</strong>
          <span className="text-xs text-text-muted">Courier Management</span>
        </span> : null}
        </Link>
      </div>
      <nav className="grid gap-1">
        <Link href="/dashboard" className={collapsed ? "grid place-items-center rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand" : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand"}>
          <LayoutDashboard className="h-4 w-4" />
          {!collapsed ? "Dashboard" : null}
        </Link>
        <details className="group" open={!collapsed}>
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand">
            <ClipboardList className="h-4 w-4" />
            {!collapsed ? <span className="flex-1">Orders</span> : null}
            {!collapsed ? <ChevronDown className="h-4 w-4 transition group-open:rotate-180" /> : null}
          </summary>
          {!collapsed ? <div className="ml-7 mt-1 grid gap-1 border-l border-border pl-3">
            <Link href="/orders?status=PENDING" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Pending Orders</Link>
            <Link href="/orders?status=DELIVERED" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Processed Orders</Link>
            <Link href="/orders" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">City Orders</Link>
            <Link href="/image-orders" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Image Orders</Link>
          </div> : null}
        </details>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand">
            <KeyRound className="h-4 w-4" />
            {!collapsed ? <span className="flex-1">Access Management</span> : null}
            {!collapsed ? <ChevronDown className="h-4 w-4 transition group-open:rotate-180" /> : null}
          </summary>
          {!collapsed ? <div className="ml-7 mt-1 grid gap-1 border-l border-border pl-3">
            <Link href="/access-management/users" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Users</Link>
            <Link href="/access-management/permissions" className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Manage Permissions</Link>
          </div> : null}
        </details>
        {navItems.map((item: NavItem) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={collapsed ? "grid place-items-center rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand" : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand"}>
              <Icon className="h-4 w-4" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
