import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { clearSessionCookie, getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const isPublicAccount = session?.role === "CLIENT" || session?.role === "RIDER";
  await clearSessionCookie();
  if (request.headers.get("accept")?.includes("text/html")) redirect(isPublicAccount ? "/login" : "/admin");
  return ok({ loggedOut: true });
}
