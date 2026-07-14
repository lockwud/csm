import type { Prisma } from "@prisma/client";
import type { NotificationType } from "@/lib/types/prismaEnums";
import { prisma } from "@/lib/prisma";
import { sendFcm } from "@/lib/fcm";

export async function listNotifications(userId?: string | null) {
  const notifications = await prisma.notification.findMany({
    where: userId
      ? {
        OR: [
          { deliveries: { some: { channel: "IN_APP", target: userId } } },
          { deliveries: { none: { channel: "IN_APP", target: { not: null } } } },
        ],
      }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      deliveries: userId
        ? { where: { OR: [{ target: userId }, { target: null }] } }
        : true,
    },
  });

  return notifications.map((notification) => {
    const targetedDelivery = userId ? notification.deliveries.find((delivery) => delivery.target === userId) : null;
    return {
      ...notification,
      isRead: targetedDelivery ? targetedDelivery.status === "READ" : notification.isRead,
      readAt: targetedDelivery?.readAt ?? notification.readAt,
    };
  });
}

type NotificationInput = {
  title: string;
  body: string;
  type?: NotificationType;
  href?: string;
  userIds?: string[];
  metadata?: Prisma.InputJsonValue;
};

export async function createNotification(input: NotificationInput) {
  const userIds = Array.from(new Set(input.userIds?.filter(Boolean) ?? []));
  return prisma.notification.create({
    data: {
      title: input.title,
      body: input.body,
      type: input.type ?? "SYSTEM",
      href: input.href,
      metadata: input.metadata,
      deliveries: {
        create: userIds.length
          ? userIds.map((userId) => ({ channel: "IN_APP" as const, status: "SENT" as const, sentAt: new Date(), target: userId }))
          : { channel: "IN_APP", status: "SENT", sentAt: new Date() },
      },
    },
  });
}

export async function markNotificationRead(id: string, userId?: string | null) {
  if (userId) {
    await prisma.notificationDelivery.updateMany({
      where: { notificationId: id, target: userId },
      data: { status: "READ", readAt: new Date() },
    });
    const unreadTargets = await prisma.notificationDelivery.count({
      where: { notificationId: id, channel: "IN_APP", target: { not: null }, status: { not: "READ" } },
    });
    if (unreadTargets === 0) {
      return prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    }
    return prisma.notification.findUnique({ where: { id }, include: { deliveries: true } });
  }
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date(), deliveries: { updateMany: { where: {}, data: { status: "READ", readAt: new Date() } } } },
  });
}

export async function markAllNotificationsRead(userId?: string | null) {
  if (userId) {
    await prisma.notificationDelivery.updateMany({
      where: { channel: "IN_APP", target: userId, status: { not: "READ" } },
      data: { status: "READ", readAt: new Date() },
    });
    return { count: 1 };
  }
  return prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true, readAt: new Date() } });
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

async function userIdsForClient(clientId?: string | null) {
  if (!clientId) return [];
  const users = await prisma.user.findMany({ where: { clientId }, select: { id: true } });
  return users.map((user) => user.id);
}

async function userIdsForRider(riderId?: string | null) {
  if (!riderId) return [];
  const users = await prisma.user.findMany({ where: { riderId }, select: { id: true } });
  return users.map((user) => user.id);
}

async function adminUserIds() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "DISPATCHER", "SUPPORT"] }, status: "ACTIVE" },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

export async function notifyClient(clientId: string | null | undefined, input: Omit<NotificationInput, "userIds">) {
  const userIds = await userIdsForClient(clientId);
  if (!userIds.length) return null;
  return createNotification({ ...input, userIds });
}

export async function notifyRider(riderId: string | null | undefined, input: Omit<NotificationInput, "userIds">) {
  const userIds = await userIdsForRider(riderId);
  if (!userIds.length) return null;
  return createNotification({ ...input, userIds });
}

export async function notifyAdmins(input: Omit<NotificationInput, "userIds">) {
  const userIds = await adminUserIds();
  if (!userIds.length) return null;
  return createNotification({ ...input, userIds });
}
