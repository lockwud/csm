import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["ACTIVE", "ON_DELIVERY", "OFFLINE", "SUSPENDED"]) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const rider = await prisma.rider.update({ where: { id }, data: input });
    const user = await prisma.user.findFirst({ where: { riderId: id }, include: { profile: true } });

    if (user) {
      const current = (user.profile?.preferences && typeof user.profile.preferences === "object" && !Array.isArray(user.profile.preferences)
        ? user.profile.preferences
        : {}) as Prisma.JsonObject;
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          preferences: {
            verificationStatus: input.status === "ACTIVE" ? "APPROVED" : input.status === "SUSPENDED" ? "SUSPENDED" : current.verificationStatus ?? "PENDING_REVIEW",
            reviewedAt: new Date().toISOString(),
          },
        },
        update: {
          preferences: {
            ...current,
            verificationStatus: input.status === "ACTIVE" ? "APPROVED" : input.status === "SUSPENDED" ? "SUSPENDED" : current.verificationStatus ?? "PENDING_REVIEW",
            reviewedAt: new Date().toISOString(),
          },
        },
      });
    }

    return ok(rider);
  } catch (error) {
    return handleApiError(error);
  }
}
