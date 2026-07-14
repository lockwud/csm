export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DISPATCHER"
  | "SUPPORT"
  | "FINANCE"
  | "CLIENT"
  | "RIDER";

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export type ClientTier = "STANDARD" | "PRIORITY" | "ENTERPRISE";

export type RiderStatus = "ACTIVE" | "ON_DELIVERY" | "OFFLINE" | "SUSPENDED";

export type OrderStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";

export type DeliveryType = "STANDARD" | "EXPRESS" | "SAME_DAY" | "SCHEDULED" | "BULK";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";

export type PaymentChannel =
  | "CARD"
  | "BANK"
  | "USSD"
  | "MOBILE_MONEY"
  | "BANK_TRANSFER"
  | "QR"
  | "UNKNOWN";

export type PaymentIntentStatus =
  | "PENDING"
  | "INITIALIZED"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "ABANDONED"
  | "REFUNDED"
  | "CANCELLED";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportStatus = "OPEN" | "WAITING_CUSTOMER" | "ESCALATED" | "RESOLVED" | "CLOSED";

export type NotificationType = "SUPPORT" | "FINANCE" | "DISPATCH" | "ORDER" | "PAYMENT" | "SYSTEM";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "ASSIGN" | "MARK_READ" | "LOGIN";
