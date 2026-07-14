import type { Prisma } from "@prisma/client";
import { handleApiError, ok } from "@/lib/api/response";
import { clearSessionCookie, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();
    if (!user || (user.role !== "CLIENT" && user.role !== "RIDER")) {
      return ok({ deleted: false });
    }

    const current = (user.profile?.preferences && typeof user.profile.preferences === "object" && !Array.isArray(user.profile.preferences)
      ? user.profile.preferences
      : {}) as Prisma.JsonObject;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "SUSPENDED",
        profile: {
          upsert: {
            create: {
              preferences: {
                accountDeletedAt: new Date().toISOString(),
                accountDeletionType: "SELF_SERVICE",
              },
            },
            update: {
              preferences: {
                ...current,
                accountDeletedAt: new Date().toISOString(),
                accountDeletionType: "SELF_SERVICE",
              },
            },
          },
        },
        rider: user.riderId ? { update: { status: "SUSPENDED" } } : undefined,
        deviceTokens: { updateMany: { where: { active: true }, data: { active: false } } },
      },
    });

    await clearSessionCookie();
    return ok({ deleted: true, redirectTo: "/login" });
  } catch (error) {
    return handleApiError(error);
  }
}
