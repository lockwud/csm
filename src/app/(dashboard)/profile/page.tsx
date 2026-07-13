import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  if (user?.role === "CLIENT") redirect("/client/settings");
  if (user?.role === "RIDER") redirect("/rider/settings");
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Profile</h1><Card><CardHeader><CardTitle>{user?.name}</CardTitle></CardHeader><CardContent><p>{user?.email}</p><p className="text-text-muted">{user?.role.replaceAll("_", " ")}</p></CardContent></Card></div>;
}
