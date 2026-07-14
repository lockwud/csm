import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/services/notificationService";

export async function PUT(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    return ok(await markNotificationRead((await params).id, session?.sub));
  } catch (error) {
    return handleApiError(error);
  }
}
