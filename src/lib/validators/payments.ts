import { z } from "zod";

export const createCheckoutSchema = z.object({
  email: z.string().email(),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("GHS"),
  orderId: z.string().trim().min(1).optional(),
  clientId: z.string().trim().min(1).optional(),
  callbackUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const verifyPaymentQuerySchema = z.object({
  reference: z.string().trim().min(1),
});
