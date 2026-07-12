import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { notificationSchema } from "@/lib/api/validators/notifications";
import { createNotification, listNotifications } from "@/lib/services/notificationService";

export async function GET() {
  try {
    return ok(await listNotifications());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await createNotification(notificationSchema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
