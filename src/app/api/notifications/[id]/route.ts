import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { markNotificationRead } from "@/lib/services/notificationService";

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await markNotificationRead((await params).id));
  } catch (error) {
    return handleApiError(error);
  }
}
