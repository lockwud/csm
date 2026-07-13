import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function PUT() {
  try {
    return ok(await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true, readAt: new Date() } }));
  } catch (error) {
    return handleApiError(error);
  }
}
