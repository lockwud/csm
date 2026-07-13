import { getSession } from "@/lib/auth/session";
import { TopbarClient } from "./TopbarClient";

export async function Topbar() {
  const user = await getSession();

  return <TopbarClient
    user={user ? {
      name: user.name,
      email: user.email,
      role: user.role,
    } : null}
    initialNotifications={[]}
  />;
}
