import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function listNotifications() {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { deliveries: true },
  });
}

export async function createNotification(input: { title: string; body: string; type?: NotificationType; href?: string }) {
  return prisma.notification.create({
    data: {
      title: input.title,
      body: input.body,
      type: input.type ?? "SYSTEM",
      href: input.href,
      deliveries: { create: { channel: "IN_APP", status: "SENT", sentAt: new Date() } },
    },
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date(), deliveries: { updateMany: { where: {}, data: { status: "READ", readAt: new Date() } } } },
  });
}

export async function registerDeviceToken(userId: string, token: string, platform?: string) {
  return prisma.notificationDeviceToken.upsert({
    where: { token },
    update: { active: true, platform },
    create: { token, platform, userId },
  });
}

export async function sendPushNotification(input: { title: string; body: string }) {
  return { queued: true, provider: "FIREBASE", message: `${input.title}: ${input.body}` };
}
