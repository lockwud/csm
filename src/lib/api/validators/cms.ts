import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
});

export const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  region: z.string().optional(),
});

export const orderSchema = z.object({
  clientId: z.string().optional(),
  riderId: z.string().optional(),
  deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).default("STANDARD"),
  city: z.string().min(2),
  description: z.string().optional(),
  amountToCollect: z.coerce.number().min(0).default(0),
  weightKg: z.coerce.number().min(0).default(0),
  itemValue: z.coerce.number().min(0).default(0),
  senderAddress: addressSchema,
  receiverAddress: addressSchema,
  items: z.array(z.object({ name: z.string().min(1), quantity: z.coerce.number().int().positive().default(1) })).default([]),
});

export const statusSchema = z.object({
  status: z.string().min(2),
  location: z.string().optional(),
  note: z.string().optional(),
});

export const clientSchema = z.object({
  businessName: z.string().min(2),
  contactName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  tier: z.enum(["STANDARD", "PRIORITY", "ENTERPRISE"]).default("STANDARD"),
});

export const riderSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  zone: z.string().min(2),
  status: z.enum(["ACTIVE", "ON_DELIVERY", "OFFLINE", "SUSPENDED"]).default("ACTIVE"),
  vehicleType: z.enum(["MOTORBIKE", "SALOON", "PICKUP", "VAN", "TRUCK"]).default("MOTORBIKE"),
});
