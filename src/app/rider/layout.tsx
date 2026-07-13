import { PortalShell } from "@/components/layout/PortalShell";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="rider">{children}</PortalShell>;
}
