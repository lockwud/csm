import type { OrderStatus } from "@/lib/types/prismaEnums";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];
