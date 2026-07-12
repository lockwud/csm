-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DISPATCHER', 'SUPPORT', 'FINANCE', 'CLIENT', 'RIDER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ClientTier" AS ENUM ('STANDARD', 'PRIORITY', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."RiderStatus" AS ENUM ('ACTIVE', 'ON_DELIVERY', 'OFFLINE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DeliveryType" AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY', 'SCHEDULED', 'BULK');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('PAYSTACK');

-- CreateEnum
CREATE TYPE "public"."PaymentChannel" AS ENUM ('CARD', 'BANK', 'USSD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'QR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."PaymentIntentStatus" AS ENUM ('PENDING', 'INITIALIZED', 'AUTHORIZED', 'PAID', 'FAILED', 'ABANDONED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."CheckoutSessionStatus" AS ENUM ('OPEN', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ImageOrderStatus" AS ENUM ('PENDING', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('MOTORBIKE', 'SALOON', 'PICKUP', 'VAN', 'TRUCK');

-- CreateEnum
CREATE TYPE "public"."DispatchShift" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "public"."ManifestStatus" AS ENUM ('DRAFT', 'READY', 'ON_ROUTE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DispatchStopStatus" AS ENUM ('PENDING', 'ARRIVED', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."FinanceEntryType" AS ENUM ('COD_COLLECTION', 'CLIENT_PAYOUT', 'RIDER_PAYOUT', 'INVOICE', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."FinanceStatus" AS ENUM ('PENDING', 'SETTLED', 'FLAGGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SupportChannel" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL', 'PORTAL');

-- CreateEnum
CREATE TYPE "public"."SupportCategory" AS ENUM ('ADDRESS_CHANGE', 'DELAYED_DELIVERY', 'PAYMENT_ISSUE', 'DAMAGED_ITEM', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."SupportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SUPPORT', 'FINANCE', 'DISPATCH', 'ORDER', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationChannelType" AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "public"."NotificationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "public"."RewardLedgerType" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ASSIGN', 'MARK_READ', 'LOGIN');

-- CreateEnum
CREATE TYPE "public"."TwoFactorMethod" AS ENUM ('AUTHENTICATOR', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."TwoFactorStatus" AS ENUM ('DISABLED', 'PENDING', 'ENABLED');

-- CreateEnum
CREATE TYPE "public"."AppSettingScope" AS ENUM ('GLOBAL', 'USER', 'CLIENT', 'RIDER');

-- CreateEnum
CREATE TYPE "public"."ReportTemplateType" AS ENUM ('OPERATIONS', 'FINANCE', 'RIDER', 'CLIENT', 'SUPPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('PDF', 'CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "public"."ReportRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "clientId" TEXT,
    "riderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "jobTitle" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "locale" TEXT NOT NULL DEFAULT 'en-GH',
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSecurity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT,
    "twoFactorStatus" "public"."TwoFactorStatus" NOT NULL DEFAULT 'DISABLED',
    "twoFactorMethod" "public"."TwoFactorMethod",
    "twoFactorSecret" TEXT,
    "twoFactorPhone" TEXT,
    "twoFactorEmail" TEXT,
    "recoveryCodesHash" TEXT[],
    "lastPasswordChangedAt" TIMESTAMP(3),
    "lastTwoFactorVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "tier" "public"."ClientTier" NOT NULL DEFAULT 'STANDARD',
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Rider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "status" "public"."RiderStatus" NOT NULL DEFAULT 'ACTIVE',
    "vehicleType" "public"."VehicleType" NOT NULL DEFAULT 'MOTORBIKE',
    "completedToday" INTEGER NOT NULL DEFAULT 0,
    "onTimeRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Ghana',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "waybill" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryType" "public"."DeliveryType" NOT NULL DEFAULT 'STANDARD',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "city" TEXT NOT NULL,
    "description" TEXT,
    "amountToCollect" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amountCollected" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "weightKg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "itemValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "clientId" TEXT,
    "riderId" TEXT,
    "senderAddressId" TEXT NOT NULL,
    "receiverAddressId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "weightKg" DECIMAL(8,2),
    "declaredValue" DECIMAL(12,2),

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImageOrder" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ImageOrderStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT,
    "convertedOrderId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ImageOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImageOrderImage" (
    "id" TEXT NOT NULL,
    "imageOrderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageOrderImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DispatchManifest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "riderId" TEXT,
    "zone" TEXT NOT NULL,
    "vehicle" "public"."VehicleType" NOT NULL DEFAULT 'MOTORBIKE',
    "shift" "public"."DispatchShift" NOT NULL DEFAULT 'MORNING',
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ManifestStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedDistanceKm" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DispatchStop" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "public"."DispatchStopStatus" NOT NULL DEFAULT 'PENDING',
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedReason" TEXT,

    CONSTRAINT "DispatchStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinanceEntry" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "public"."FinanceEntryType" NOT NULL,
    "party" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "public"."FinanceStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "clientId" TEXT,
    "riderId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentIntent" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL DEFAULT 'PAYSTACK',
    "providerReference" TEXT,
    "authorizationUrl" TEXT,
    "accessCode" TEXT,
    "channel" "public"."PaymentChannel" NOT NULL DEFAULT 'UNKNOWN',
    "status" "public"."PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "amount" DECIMAL(12,2) NOT NULL,
    "fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gatewayResponse" TEXT,
    "paidAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "orderId" TEXT,
    "clientId" TEXT,
    "financeEntryId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckoutSession" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" "public"."CheckoutSessionStatus" NOT NULL DEFAULT 'OPEN',
    "checkoutUrl" TEXT,
    "returnUrl" TEXT,
    "cancelUrl" TEXT,
    "orderId" TEXT,
    "clientId" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaystackWebhookEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "reference" TEXT,
    "signature" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "paymentIntentId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaystackWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "channel" "public"."SupportChannel" NOT NULL DEFAULT 'PORTAL',
    "category" "public"."SupportCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "public"."SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'OPEN',
    "lastUpdate" TEXT,
    "orderId" TEXT,
    "clientId" TEXT,
    "ownerId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "href" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'FIREBASE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "public"."NotificationChannelType" NOT NULL DEFAULT 'IN_APP',
    "status" "public"."NotificationDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "target" TEXT,
    "deviceTokenId" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RewardLedger" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "public"."RewardLedgerType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "baseFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricingRule" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT,
    "deliveryType" "public"."DeliveryType" NOT NULL DEFAULT 'STANDARD',
    "baseFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "perKmFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "codFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "maxWeightKg" DECIMAL(8,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "scope" "public"."AppSettingScope" NOT NULL DEFAULT 'GLOBAL',
    "value" JSONB NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "clientId" TEXT,
    "riderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConfigurationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigurationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConfigurationItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigurationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ReportTemplateType" NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "format" "public"."ReportFormat" NOT NULL DEFAULT 'PDF',
    "columns" JSONB NOT NULL,
    "filters" JSONB,
    "schedule" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportRun" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "requestedById" TEXT,
    "clientId" TEXT,
    "status" "public"."ReportRunStatus" NOT NULL DEFAULT 'QUEUED',
    "format" "public"."ReportFormat" NOT NULL DEFAULT 'PDF',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "parameters" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "public"."User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecurity_userId_key" ON "public"."UserSecurity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "public"."UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_expiresAt_idx" ON "public"."UserSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Client_tier_idx" ON "public"."Client"("tier");

-- CreateIndex
CREATE INDEX "Client_businessName_idx" ON "public"."Client"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "Rider_phone_key" ON "public"."Rider"("phone");

-- CreateIndex
CREATE INDEX "Rider_status_zone_idx" ON "public"."Rider"("status", "zone");

-- CreateIndex
CREATE INDEX "Address_city_region_idx" ON "public"."Address"("city", "region");

-- CreateIndex
CREATE INDEX "Address_phone_idx" ON "public"."Address"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_waybill_key" ON "public"."Order"("waybill");

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingCode_key" ON "public"."Order"("trackingCode");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_city_status_idx" ON "public"."Order"("city", "status");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "public"."Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_riderId_idx" ON "public"."Order"("riderId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "TrackingEvent_orderId_happenedAt_idx" ON "public"."TrackingEvent"("orderId", "happenedAt");

-- CreateIndex
CREATE INDEX "TrackingEvent_status_happenedAt_idx" ON "public"."TrackingEvent"("status", "happenedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImageOrder_convertedOrderId_key" ON "public"."ImageOrder"("convertedOrderId");

-- CreateIndex
CREATE INDEX "ImageOrder_status_submittedAt_idx" ON "public"."ImageOrder"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "ImageOrder_senderPhone_idx" ON "public"."ImageOrder"("senderPhone");

-- CreateIndex
CREATE INDEX "ImageOrderImage_imageOrderId_idx" ON "public"."ImageOrderImage"("imageOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchManifest_code_key" ON "public"."DispatchManifest"("code");

-- CreateIndex
CREATE INDEX "DispatchManifest_status_createdAt_idx" ON "public"."DispatchManifest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchManifest_riderId_idx" ON "public"."DispatchManifest"("riderId");

-- CreateIndex
CREATE INDEX "DispatchStop_orderId_idx" ON "public"."DispatchStop"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchStop_manifestId_orderId_key" ON "public"."DispatchStop"("manifestId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchStop_manifestId_sequence_key" ON "public"."DispatchStop"("manifestId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceEntry_reference_key" ON "public"."FinanceEntry"("reference");

-- CreateIndex
CREATE INDEX "FinanceEntry_status_date_idx" ON "public"."FinanceEntry"("status", "date");

-- CreateIndex
CREATE INDEX "FinanceEntry_type_date_idx" ON "public"."FinanceEntry"("type", "date");

-- CreateIndex
CREATE INDEX "FinanceEntry_clientId_idx" ON "public"."FinanceEntry"("clientId");

-- CreateIndex
CREATE INDEX "FinanceEntry_riderId_idx" ON "public"."FinanceEntry"("riderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_reference_key" ON "public"."PaymentIntent"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_financeEntryId_key" ON "public"."PaymentIntent"("financeEntryId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_createdAt_idx" ON "public"."PaymentIntent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_provider_providerReference_idx" ON "public"."PaymentIntent"("provider", "providerReference");

-- CreateIndex
CREATE INDEX "PaymentIntent_orderId_idx" ON "public"."PaymentIntent"("orderId");

-- CreateIndex
CREATE INDEX "PaymentIntent_clientId_idx" ON "public"."PaymentIntent"("clientId");

-- CreateIndex
CREATE INDEX "CheckoutSession_status_createdAt_idx" ON "public"."CheckoutSession"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CheckoutSession_paymentIntentId_idx" ON "public"."CheckoutSession"("paymentIntentId");

-- CreateIndex
CREATE INDEX "CheckoutSession_orderId_idx" ON "public"."CheckoutSession"("orderId");

-- CreateIndex
CREATE INDEX "PaystackWebhookEvent_reference_idx" ON "public"."PaystackWebhookEvent"("reference");

-- CreateIndex
CREATE INDEX "PaystackWebhookEvent_processed_receivedAt_idx" ON "public"."PaystackWebhookEvent"("processed", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_reference_key" ON "public"."SupportTicket"("reference");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "public"."SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_orderId_idx" ON "public"."SupportTicket"("orderId");

-- CreateIndex
CREATE INDEX "SupportTicket_clientId_idx" ON "public"."SupportTicket"("clientId");

-- CreateIndex
CREATE INDEX "Notification_isRead_createdAt_idx" ON "public"."Notification"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "public"."Notification"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDeviceToken_token_key" ON "public"."NotificationDeviceToken"("token");

-- CreateIndex
CREATE INDEX "NotificationDeviceToken_userId_active_idx" ON "public"."NotificationDeviceToken"("userId", "active");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "public"."NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "public"."NotificationDelivery"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_deviceTokenId_idx" ON "public"."NotificationDelivery"("deviceTokenId");

-- CreateIndex
CREATE INDEX "RewardLedger_clientId_createdAt_idx" ON "public"."RewardLedger"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardLedger_orderId_idx" ON "public"."RewardLedger"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceZone_name_key" ON "public"."ServiceZone"("name");

-- CreateIndex
CREATE INDEX "ServiceZone_city_active_idx" ON "public"."ServiceZone"("city", "active");

-- CreateIndex
CREATE INDEX "PricingRule_deliveryType_active_idx" ON "public"."PricingRule"("deliveryType", "active");

-- CreateIndex
CREATE INDEX "PricingRule_zoneId_idx" ON "public"."PricingRule"("zoneId");

-- CreateIndex
CREATE INDEX "AppSetting_scope_idx" ON "public"."AppSetting"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_scope_userId_clientId_riderId_key" ON "public"."AppSetting"("key", "scope", "userId", "clientId", "riderId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationCategory_name_key" ON "public"."ConfigurationCategory"("name");

-- CreateIndex
CREATE INDEX "ConfigurationItem_active_sortOrder_idx" ON "public"."ConfigurationItem"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigurationItem_categoryId_key_key" ON "public"."ConfigurationItem"("categoryId", "key");

-- CreateIndex
CREATE INDEX "ReportTemplate_type_active_idx" ON "public"."ReportTemplate"("type", "active");

-- CreateIndex
CREATE INDEX "ReportRun_status_createdAt_idx" ON "public"."ReportRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReportRun_templateId_idx" ON "public"."ReportRun"("templateId");

-- CreateIndex
CREATE INDEX "ReportRun_clientId_idx" ON "public"."ReportRun"("clientId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "public"."AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "public"."AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSecurity" ADD CONSTRAINT "UserSecurity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_senderAddressId_fkey" FOREIGN KEY ("senderAddressId") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_receiverAddressId_fkey" FOREIGN KEY ("receiverAddressId") REFERENCES "public"."Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TrackingEvent" ADD CONSTRAINT "TrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageOrder" ADD CONSTRAINT "ImageOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageOrder" ADD CONSTRAINT "ImageOrder_convertedOrderId_fkey" FOREIGN KEY ("convertedOrderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageOrderImage" ADD CONSTRAINT "ImageOrderImage_imageOrderId_fkey" FOREIGN KEY ("imageOrderId") REFERENCES "public"."ImageOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispatchManifest" ADD CONSTRAINT "DispatchManifest_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispatchStop" ADD CONSTRAINT "DispatchStop_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "public"."DispatchManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispatchStop" ADD CONSTRAINT "DispatchStop_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceEntry" ADD CONSTRAINT "FinanceEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceEntry" ADD CONSTRAINT "FinanceEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceEntry" ADD CONSTRAINT "FinanceEntry_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_financeEntryId_fkey" FOREIGN KEY ("financeEntryId") REFERENCES "public"."FinanceEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentIntent" ADD CONSTRAINT "PaymentIntent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckoutSession" ADD CONSTRAINT "CheckoutSession_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckoutSession" ADD CONSTRAINT "CheckoutSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckoutSession" ADD CONSTRAINT "CheckoutSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckoutSession" ADD CONSTRAINT "CheckoutSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaystackWebhookEvent" ADD CONSTRAINT "PaystackWebhookEvent_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "public"."PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDeviceToken" ADD CONSTRAINT "NotificationDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_deviceTokenId_fkey" FOREIGN KEY ("deviceTokenId") REFERENCES "public"."NotificationDeviceToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardLedger" ADD CONSTRAINT "RewardLedger_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RewardLedger" ADD CONSTRAINT "RewardLedger_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingRule" ADD CONSTRAINT "PricingRule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."ServiceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppSetting" ADD CONSTRAINT "AppSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppSetting" ADD CONSTRAINT "AppSetting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppSetting" ADD CONSTRAINT "AppSetting_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "public"."Rider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConfigurationItem" ADD CONSTRAINT "ConfigurationItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ConfigurationCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportTemplate" ADD CONSTRAINT "ReportTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportRun" ADD CONSTRAINT "ReportRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ReportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportRun" ADD CONSTRAINT "ReportRun_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportRun" ADD CONSTRAINT "ReportRun_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
