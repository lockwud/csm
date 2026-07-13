import { PortalShell } from "@/components/layout/PortalShell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="client">{children}</PortalShell>;
}
