import { getSession } from "@/lib/auth/session";
import { PortalShellClient } from "./PortalShellClient";

export async function PortalShell({ children, portal }: { children: React.ReactNode; portal: "client" | "rider" }) {
  const user = await getSession();
  return (
    <PortalShellClient
      portal={portal}
      user={user ? { name: user.name, email: user.email, role: user.role } : null}
    >
      {children}
    </PortalShellClient>
  );
}
