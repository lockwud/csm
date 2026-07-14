import { handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/services/notificationService";

export async function PUT() {
  try {
    const session = await getSession();
    return ok(await markAllNotificationsRead(session?.sub));
  } catch (error) {
    return handleApiError(error);
  }
}
