import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export async function Topbar() {
  const user = await requireUser();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden min-w-72 items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-text-muted md:flex">
          <Search className="h-4 w-4" />
          Search waybill, client, rider
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/notifications" className="grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Link>
          {user ? (
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar name={user.name} src={user.profile?.avatarUrl} />
              <span className="hidden text-sm md:block">
                <strong className="block">{user.name}</strong>
                <span className="text-text-muted">{user.role.replaceAll("_", " ")}</span>
              </span>
            </Link>
          ) : null}
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="ghost" size="icon" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
