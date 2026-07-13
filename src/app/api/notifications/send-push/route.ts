import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { notificationSchema } from "@/lib/api/validators/notifications";
import { sendPushNotification } from "@/lib/services/notificationService";

export async function POST(request: NextRequest) {
  try {
    const input = notificationSchema.parse(await request.json());
    return ok(await sendPushNotification(input));
  } catch (error) {
    return handleApiError(error);
  }
}
