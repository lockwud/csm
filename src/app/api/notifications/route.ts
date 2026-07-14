import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { notificationSchema } from "@/lib/api/validators/notifications";
import { getSession } from "@/lib/auth/session";
import { createNotification, listNotifications } from "@/lib/services/notificationService";

export async function GET() {
  try {
    const session = await getSession();
    return ok(await listNotifications(session?.sub));
  } catch {
    console.warn("Notifications unavailable. Check DATABASE_URL connectivity.");
    return ok([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await createNotification(notificationSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
