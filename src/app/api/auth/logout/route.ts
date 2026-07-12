import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await clearSessionCookie();
  if (request.headers.get("accept")?.includes("text/html")) redirect("/login");
  return ok({ loggedOut: true });
}
