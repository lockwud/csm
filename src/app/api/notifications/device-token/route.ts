import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { deviceTokenSchema } from "@/lib/api/validators/notifications";
import { registerDeviceToken } from "@/lib/services/notificationService";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return fail(401, "Authentication required");
    const input = deviceTokenSchema.parse(await request.json());
    return ok(await registerDeviceToken(session.sub, input.token, input.platform));
  } catch (error) {
    return handleApiError(error);
  }
}
