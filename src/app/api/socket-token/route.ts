import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { signSession } from "@/lib/auth/jwt";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const token = signSession(
    { sub: session.sub, email: session.email, name: session.name, role: session.role, clientId: session.clientId, riderId: session.riderId },
    5 * 60
  );
  return NextResponse.json({ ok: true, token, session });
}
