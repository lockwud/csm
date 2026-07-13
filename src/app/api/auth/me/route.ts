import { fail, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return fail(401, "Authentication required");
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile });
}
