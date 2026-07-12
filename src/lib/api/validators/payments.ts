import { z } from "zod";

export const paymentIntentSchema = z.object({
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("GHS"),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
