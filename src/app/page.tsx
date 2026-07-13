import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/roleHome";

export default async function HomePage() {
  const session = await getSession();
  redirect(session ? homeForRole(session.role) : "/login");
}
