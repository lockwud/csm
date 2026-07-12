import { z } from "zod";

export const deviceTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.string().optional(),
});

export const notificationSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  type: z.enum(["SUPPORT", "FINANCE", "DISPATCH", "ORDER", "PAYMENT", "SYSTEM"]).default("SYSTEM"),
  href: z.string().optional(),
});
