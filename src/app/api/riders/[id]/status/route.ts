import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { notifyRider } from "@/lib/services/notificationService";
import { asJsonObject } from "@/lib/types/json";

const schema = z.object({ status: z.enum(["ACTIVE", "ON_DELIVERY", "OFFLINE", "SUSPENDED"]) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    await prisma.rider.update({ where: { id }, data: input });
    const user = await prisma.user.findFirst({ where: { riderId: id }, include: { profile: true } });

    if (user) {
      const current = asJsonObject(user.profile?.preferences);
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

    const rider = await prisma.rider.findUnique({
      where: { id },
      include: { users: { include: { profile: true } } },
    });

    await notifyRider(id, {
      title: input.status === "ACTIVE" ? "Rider account approved" : input.status === "SUSPENDED" ? "Rider account suspended" : "Rider status updated",
      body: `Your rider status is now ${input.status.replaceAll("_", " ").toLowerCase()}.`,
      type: "SYSTEM",
      href: "/rider/dashboard",
      metadata: { riderId: id, status: input.status },
    });

    return ok(rider);
  } catch (error) {
    return handleApiError(error);
  }
}
