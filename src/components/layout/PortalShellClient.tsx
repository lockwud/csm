"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Bell,
  BellOff,
  Bike,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  Home,
  ListChecks,
  LogOut,
  MapPinned,
  Menu,
  PackagePlus,
  Route,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

type PortalUser = { name: string; email: string; role: string } | null;
type PortalNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type PortalNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  children?: Array<{ href: string; label: string }>;
};

const portalNav: Record<"client" | "rider", PortalNavItem[]> = {
  client: [
    { href: "/client/dashboard", label: "Dashboard", icon: Home },
    { href: "/client/quick-order", label: "Quick Order", icon: PackagePlus },
    { href: "/client/orders", label: "My Orders", icon: ListChecks },
    { href: "/client/payments", label: "Payment History", icon: CreditCard },
    { href: "/client/support", label: "Support", icon: Headphones, children: [
      { href: "/client/support?status=pending", label: "Pending" },
      { href: "/client/support?status=resolved", label: "Resolved" },
    ] },
  ],
  rider: [
    { href: "/rider/dashboard", label: "Route Dashboard", icon: Route },
    { href: "/rider/orders", label: "Assigned Orders", icon: MapPinned },
    { href: "/rider/support", label: "Support", icon: Headphones, children: [
      { href: "/rider/support?status=pending", label: "Pending" },
      { href: "/rider/support?status=resolved", label: "Resolved" },
    ] },
  ],
};

function PortalBrand({ portal, title, homeHref, compact = false }: { portal: "client" | "rider"; title: string; homeHref: string; compact?: boolean }) {
  return (
    <Link href={homeHref} className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand text-lg font-black text-white">{portal === "client" ? "S" : <Bike className="h-5 w-5" />}</span>
      {!compact ? (
        <span className="min-w-0">
          <strong className="block truncate leading-tight">Sankofa Express</strong>
          <span className="text-xs text-text-muted">{title}</span>
        </span>
      ) : null}
    </Link>
  );
}

export function PortalShellClient({ children, portal, user }: { children: React.ReactNode; portal: "client" | "rider"; user: PortalUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loadedNotifications, setLoadedNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const settingsHref = portal === "client" ? "/client/settings" : "/rider/settings";
  const homeHref = portal === "client" ? "/client/dashboard" : "/rider/dashboard";
  const title = portal === "client" ? "Client Portal" : "Rider Portal";
  const nav = portalNav[portal];
  const unread = notifications.filter((item) => !item.isRead).length;

  async function openNotifications() {
    setNotificationsOpen(true);
    if (loadedNotifications) return;

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as { data?: Array<PortalNotification & { createdAt: string | Date }> };
      setNotifications((result.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        isRead: item.isRead,
        createdAt: String(item.createdAt),
      })));
      setLoadedNotifications(true);
    } catch {
      setLoadedNotifications(true);
    }
  }

  const profileMenu = user ? (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-1 py-1 hover:bg-slate-100">
        <Avatar name={user.name} size="sm" />
        <ChevronDown className="h-3.5 w-3.5 text-text-muted transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{user.name}</strong>
              <p className="truncate text-xs text-text-muted">{user.email}</p>
              <p className="truncate text-xs text-text-muted">{user.role.replaceAll("_", " ")}</p>
            </div>
          </div>
        </div>
        <Link href={settingsHref} className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">
          <UserRound className="h-4 w-4" />
          Profile
        </Link>
        <Link href={`${settingsHref}?section=security`} className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <form action="/api/auth/logout" method="post" className="border-t border-border">
          <button type="submit" className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger-light">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </details>
  ) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text">
      <aside className={collapsed ? "hidden h-screen w-20 shrink-0 overflow-y-auto border-r border-border bg-white px-3 py-5 lg:block" : "hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-white px-4 py-5 lg:block"}>
        <div className="mb-8">
          <PortalBrand portal={portal} title={title} homeHref={homeHref} compact={collapsed} />
        </div>
        <nav className="grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (item.children && !collapsed) {
              return (
                <details key={item.href} className="group" open={active}>
                  <summary className={active ? "flex cursor-pointer list-none items-center gap-3 rounded-md bg-brand-light px-3 py-2 text-sm font-bold text-brand" : "flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand"}>
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>
                  <div className="ml-7 mt-1 grid gap-1 border-l border-border pl-3">
                    <Link href={item.href} className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">Log Ticket</Link>
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href} className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">{child.label}</Link>
                    ))}
                  </div>
                </details>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={active ? (collapsed ? "grid place-items-center rounded-md bg-brand-light px-3 py-2 text-sm font-bold text-brand" : "flex items-center gap-3 rounded-md bg-brand-light px-3 py-2 text-sm font-bold text-brand") : (collapsed ? "grid place-items-center rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand" : "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-brand-light hover:text-brand")}>
                <Icon className="h-4 w-4" />
                {!collapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <button type="button" onClick={() => setMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-text-muted" aria-label="Open menu">
                <Menu className="h-4 w-4" />
              </button>
              <PortalBrand portal={portal} title={title} homeHref={homeHref} />
            </div>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-8 w-8 place-items-center rounded-full bg-white text-text-muted shadow-sm hover:bg-slate-50 hover:text-brand lg:grid"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <div className={searchOpen ? "flex h-10 w-56 items-center gap-2 rounded-lg bg-slate-100 px-3 transition-all md:w-64" : "flex h-10 w-10 items-center justify-center transition-all"}>
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => setSearchOpen((value) => !value)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-text-muted hover:text-brand"
                >
                  <Search className="h-4 w-4" />
                </button>
                {searchOpen ? (
                  <>
                    <input
                      autoFocus
                      type="search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search"
                      className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                    />
                    <button
                      type="button"
                      aria-label="Close search"
                      onClick={() => {
                        setSearchValue("");
                        setSearchOpen(false);
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-muted hover:bg-white hover:text-brand"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>
              <button type="button" onClick={openNotifications} className="relative grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-slate-100 hover:text-brand" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 ? <span className="absolute -right-0.5 -top-0.5 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{unread > 99 ? "99+" : unread}</span> : null}
              </button>
              {profileMenu}
            </div>
          </div>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 bg-white p-5 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <PortalBrand portal={portal} title={title} homeHref={homeHref} />
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-slate-100" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="grid gap-2">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <div key={item.href} className="grid gap-1">
                      <Link href={item.href} onClick={() => setMenuOpen(false)} className={active ? "flex items-center gap-3 rounded-md bg-brand-light px-4 py-3 text-sm font-bold text-brand" : "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-text-muted hover:bg-brand-light hover:text-brand"}>
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                      {item.children ? (
                        <div className="ml-7 grid gap-1 border-l border-border pl-3">
                          {item.children.map((child) => (
                            <Link key={child.href} href={child.href} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">{child.label}</Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </nav>
            </aside>
          </div>
        ) : null}

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1500px] p-4 md:p-6">{children}</div>
        </main>
      </div>

      {notificationsOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-[3px]"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[360px] border-l border-border bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-bold">Notifications</h2>
                <p className="mt-1 text-xs text-text-muted">{unread} unread notifications</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="text-xs font-semibold text-brand">Mark all read</button>
                <button type="button" aria-label="Close" onClick={() => setNotificationsOpen(false)} className="rounded p-1 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="border-b border-border bg-slate-50 px-5 py-3 text-xs font-bold text-text">Today</div>
            <div className="h-[calc(100%-104px)] overflow-y-auto">
              {notifications.length ? notifications.map((item, index) => (
                <div key={item.id} className="relative grid grid-cols-[24px_1fr] gap-3 border-b border-border px-5 py-5">
                  <span className={index < 3 ? "absolute bottom-0 left-0 top-0 w-1 bg-success" : "absolute bottom-0 left-0 top-0 w-1 bg-brand"} />
                  <span className={item.isRead ? "mt-0.5 grid h-5 w-5 place-items-center rounded border border-brand-light text-brand" : "mt-0.5 grid h-5 w-5 place-items-center rounded-full text-success"}>
                    {item.isRead ? <BriefcaseBusiness className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-text">{item.title}</p>
                      <button type="button" className="shrink-0 text-xs font-semibold text-brand">Mark as read</button>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">{item.body}</p>
                    <p className="mt-3 text-xs text-text-muted">1m ago</p>
                  </div>
                </div>
              )) : (
                <div className="flex h-80 flex-col items-center justify-center px-8 text-center text-sm text-text-muted">
                  <BellOff className="mb-4 h-12 w-12 text-slate-400" />
                  <span>No notifications yet.</span>
                </div>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
