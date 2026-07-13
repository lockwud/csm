export type OrderStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export type DeliveryType = "standard" | "express" | "same_day" | "scheduled" | "bulk";

export interface Party {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
}

export interface Order {
  id: string;
  waybill: string;
  trackingCode: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  createdAt: string;
  sender: Party;
  receiver: Party;
  amountToCollect: number;
  weightKg: number;
  itemValue: number;
  rider?: string;
  city: string;
}

export interface ImageOrder {
  id: string;
  label: string;
  submittedBy: string;
  submittedAt: string;
  itemCount: number;
  senderPhone: string;
  images: string[];
  status: "pending" | "processed";
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: "active" | "on_delivery" | "offline";
  completedToday: number;
  onTimeRate: number;
  rating: number;
  walletBalance: number;
}

export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  ordersThisMonth: number;
  outstandingBalance: number;
  tier: "standard" | "priority" | "enterprise";
}

export interface FinanceEntry {
  id: string;
  reference: string;
  type: "cod_collection" | "client_payout" | "rider_payout" | "invoice";
  party: string;
  amount: number;
  currency: "GHS";
  status: "pending" | "settled" | "flagged";
  date: string;
}

export interface DispatchManifest {
  id: string;
  code: string;
  riderId: string;
  zone: string;
  vehicle: "motorbike" | "van" | "pickup";
  shift: "morning" | "afternoon" | "evening";
  capacity: number;
  assignedOrderIds: string[];
  status: "draft" | "ready" | "on_route";
  plannedDistanceKm: number;
  estimatedMinutes: number;
}

export interface SupportTicket {
  id: string;
  reference: string;
  orderId: string;
  customer: string;
  channel: "whatsapp" | "phone" | "email" | "portal";
  category: "address_change" | "delayed_delivery" | "payment_issue" | "damaged_item";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "waiting_customer" | "escalated" | "resolved";
  owner: string;
  openedAt: string;
  lastUpdate: string;
}

export interface PerformanceReport {
  id: string;
  title: string;
  metric: string;
  value: string;
  change: string;
  tone: "success" | "warning" | "neutral";
}
