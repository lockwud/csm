"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, Check, KeyRound, LogOut, Search, UserRound, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { initFirebaseAnalytics, listenForForegroundMessages, registerWebPushToken } from "@/lib/firebase/client";

type TopbarUser = {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

type TopbarNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type SearchResult = {
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

export function TopbarClient({
  user,
  initialNotifications,
}: {
  user: TopbarUser | null;
  initialNotifications: TopbarNotification[];
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loadedNotifications, setLoadedNotifications] = useState(initialNotifications.length > 0);
  const unread = notifications.filter((item: TopbarNotification) => !item.isRead).length;

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    initFirebaseAnalytics().catch(() => null);
    registerWebPushToken().catch(() => null);
    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title ?? "Sankofa Express";
      const body = payload.notification?.body ?? "You have a new notification.";
      const nextNotification: TopbarNotification = {
        id: payload.messageId ?? crypto.randomUUID(),
        title,
        body,
        type: payload.data?.type ?? "SYSTEM",
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((items: TopbarNotification[]) => [nextNotification, ...items.filter((item: TopbarNotification) => item.id !== nextNotification.id)].slice(0, 30));

      if (Notification.permission === "granted" && document.visibilityState === "visible") {
        new Notification(title, { body, icon: "/window.svg" });
      }
    }).then((handler) => {
      if (mounted) unsubscribe = handler;
      else handler();
    }).catch(() => null);

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [user]);

  useEffect(() => {
    if (!searchOpen || searchValue.trim().length < 2) {
      return;
    }
    const timeout = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchValue.trim())}`, { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const payload = await response.json().catch(() => null) as { data?: SearchResult[] } | null;
      setSearchResults(payload?.data ?? []);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchOpen, searchValue]);

  async function openNotifications() {
    setNotificationsOpen(true);
    if (loadedNotifications) return;

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json() as { data?: Array<TopbarNotification & { createdAt: string | Date }> };
      setNotifications((result.data ?? []).map((item: TopbarNotification & { createdAt: string | Date }) => ({
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

  function toggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    window.dispatchEvent(new CustomEvent("sankofa:sidebar-toggle", { detail: { collapsed: next } }));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleSidebar}
          className="hidden h-8 w-8 place-items-center rounded-full bg-white text-text-muted shadow-sm hover:bg-slate-50 hover:text-brand lg:grid"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
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
          {searchOpen && searchValue.trim().length >= 2 ? (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
              {searchResults.length ? searchResults.map((item: SearchResult) => (
                <a key={`${item.type}-${item.href}-${item.title}`} href={item.href} className="block border-b border-border px-4 py-3 hover:bg-slate-50">
                  <p className="text-xs font-black uppercase text-brand">{item.type}</p>
                  <p className="mt-1 text-sm font-bold text-text">{item.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.subtitle}</p>
                </a>
              )) : <p className="px-4 py-5 text-sm text-text-muted">No results found.</p>}
            </div>
          ) : null}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-md bg-transparent"
            aria-label="Notifications"
            onClick={openNotifications}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Button>

          {user ? (
            <details className="group relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-md bg-transparent px-1.5 text-xs font-bold text-text-muted hover:bg-slate-50">
                <Avatar name={user.name} size="sm" />
                <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
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
                <a href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">
                  <UserRound className="h-4 w-4" />
                  Profile
                </a>
                <a href="/settings?tab=Security" className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand">
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </a>
                <form action="/api/auth/logout" method="post" className="border-t border-border">
                  <button type="submit" className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-danger hover:bg-danger-light">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </div>
            </details>
          ) : null}
        </div>
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
              {notifications.length ? notifications.map((item: TopbarNotification, index: number) => (
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
    </header>
  );
}
