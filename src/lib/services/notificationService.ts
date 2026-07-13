import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendFcm } from "@/lib/fcm";

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

export async function sendPushNotification(input: { title: string; body: string; type?: NotificationType; href?: string }) {
  const notification = await createNotification({
    title: input.title,
    body: input.body,
    type: input.type,
    href: input.href,
  });
  const tokens = await prisma.notificationDeviceToken.findMany({
    where: { active: true, provider: "FIREBASE" },
    select: { id: true, token: true },
  });

  const deliveries = await Promise.all(tokens.map(async (deviceToken) => {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: "PUSH",
        status: "QUEUED",
        target: deviceToken.token,
        deviceTokenId: deviceToken.id,
        provider: "FIREBASE",
      },
    });

    try {
      const result = await sendFcm({
        token: deviceToken.token,
        title: input.title,
        body: input.body,
      });
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          providerMessageId: typeof result === "string" ? result : undefined,
        },
      });
      return { status: "sent" as const };
    } catch (error) {
      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Firebase delivery failed",
        },
      });
      return { status: "failed" as const };
    }
  }));

  return {
    notificationId: notification.id,
    provider: "FIREBASE",
    queued: tokens.length,
    sent: deliveries.filter((delivery) => delivery.status === "sent").length,
    failed: deliveries.filter((delivery) => delivery.status === "failed").length,
  };
}
