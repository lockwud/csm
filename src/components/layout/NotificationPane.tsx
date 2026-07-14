import { listNotifications } from "@/lib/services/notificationService";
import { Badge } from "@/components/ui/Badge";

type PaneNotification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
};

export async function NotificationPane() {
  const notifications = await listNotifications().catch(() => []) as PaneNotification[];
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Notifications</h2>
        <Badge variant="info">{notifications.filter((item: PaneNotification) => !item.isRead).length} unread</Badge>
      </div>
      <div className="grid gap-3">
        {notifications.slice(0, 5).map((item: PaneNotification) => (
          <div key={item.id} className="rounded-md bg-slate-50 p-3">
            <p className="text-sm font-bold">{item.title}</p>
            <p className="text-xs text-text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
