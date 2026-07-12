import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "SUPPORT",
  "FINANCE",
  "DISPATCH",
  "ORDER",
  "SYSTEM",
]);

export const createNotificationSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  type: notificationTypeSchema.default("SYSTEM"),
  href: z.string().trim().min(1).max(200).optional(),
  isRead: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const notificationQuerySchema = z.object({
  status: z.enum(["all", "read", "unread"]).default("all"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const markNotificationSchema = z.object({
  isRead: z.boolean(),
});
