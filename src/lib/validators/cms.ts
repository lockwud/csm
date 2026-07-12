import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().min(1),
  region: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).default("STANDARD"),
  city: z.string().trim().min(1),
  description: z.string().trim().optional(),
  amountToCollect: z.coerce.number().min(0).default(0),
  weightKg: z.coerce.number().min(0).default(0),
  itemValue: z.coerce.number().min(0).default(0),
  clientId: z.string().optional(),
  riderId: z.string().optional(),
  sender: addressSchema,
  receiver: addressSchema,
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).default(1),
        weightKg: z.coerce.number().min(0).optional(),
        declaredValue: z.coerce.number().min(0).optional(),
      }),
    )
    .default([]),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "RETURNED",
    "CANCELLED",
  ]),
  note: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export const createRiderSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  zone: z.string().trim().min(1),
  vehicleType: z.enum(["MOTORBIKE", "SALOON", "PICKUP", "VAN", "TRUCK"]).default("MOTORBIKE"),
});

export const createClientSchema = z.object({
  businessName: z.string().trim().min(1),
  contactName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().email().optional(),
  tier: z.enum(["STANDARD", "PRIORITY", "ENTERPRISE"]).default("STANDARD"),
});

export const createFinanceEntrySchema = z.object({
  reference: z.string().trim().min(1),
  type: z.enum(["COD_COLLECTION", "CLIENT_PAYOUT", "RIDER_PAYOUT", "INVOICE", "REFUND", "ADJUSTMENT"]),
  party: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("GHS"),
  status: z.enum(["PENDING", "SETTLED", "FLAGGED", "CANCELLED"]).default("PENDING"),
  date: z.coerce.date().default(() => new Date()),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  riderId: z.string().optional(),
});

export const createSupportTicketSchema = z.object({
  reference: z.string().trim().min(1),
  customer: z.string().trim().min(1),
  channel: z.enum(["WHATSAPP", "PHONE", "EMAIL", "PORTAL"]).default("PORTAL"),
  category: z.enum(["ADDRESS_CHANGE", "DELAYED_DELIVERY", "PAYMENT_ISSUE", "DAMAGED_ITEM", "GENERAL"]).default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  ownerId: z.string().optional(),
  lastUpdate: z.string().trim().optional(),
});

export const createManifestSchema = z.object({
  code: z.string().trim().min(1),
  riderId: z.string().optional(),
  zone: z.string().trim().min(1),
  vehicle: z.enum(["MOTORBIKE", "SALOON", "PICKUP", "VAN", "TRUCK"]).default("MOTORBIKE"),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).default("MORNING"),
  capacity: z.coerce.number().int().min(0).default(0),
  plannedDistanceKm: z.coerce.number().min(0).default(0),
  estimatedMinutes: z.coerce.number().int().min(0).default(0),
  orderIds: z.array(z.string()).default([]),
});
