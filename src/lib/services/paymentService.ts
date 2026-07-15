import { prisma } from "@/lib/prisma";
import type { PaymentChannel, PaymentIntentStatus } from "@/lib/types/prismaEnums";
import { fromPaystackSubunit, initializePaystackTransaction, verifyPaystackTransaction, type PaystackVerifyData } from "@/lib/paystack";
import { nextReference } from "@/lib/services/referenceService";
import { createFinanceEntry } from "@/lib/services/financeService";
import { sendPaymentReceiptEmail } from "@/lib/email/mailer";
import { notifyAdmins, notifyClient } from "@/lib/services/notificationService";
import { ApiError } from "@/lib/api/response";

function mapChannel(channel: string | null | undefined): PaymentChannel {
  const normalized = channel?.toUpperCase().replaceAll(" ", "_");
  if (normalized === "CARD") return "CARD";
  if (normalized === "BANK") return "BANK";
  if (normalized === "USSD") return "USSD";
  if (normalized === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (normalized === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (normalized === "QR") return "QR";
  return "UNKNOWN";
}

function mapStatus(status: string): PaymentIntentStatus {
  if (status === "success") return "PAID";
  if (status === "failed") return "FAILED";
  if (status === "abandoned") return "ABANDONED";
  return "AUTHORIZED";
}

async function resolvePaymentEmail(input: { clientId?: string; orderId?: string; createdById?: string; email?: string }) {
  if (input.email) return input.email;
  if (input.createdById) {
    const user = await prisma.user.findUnique({ where: { id: input.createdById }, select: { email: true } });
    if (user?.email) return user.email;
  }
  if (input.clientId) {
    const client = await prisma.client.findUnique({ where: { id: input.clientId }, select: { email: true } });
    if (client?.email) return client.email;
  }
  if (input.orderId) {
    const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { client: true } });
    if (order?.client?.email) return order.client.email;
  }
  return "payments@sankofaexpress.local";
}

export async function createPaymentIntent(input: {
  amount: number;
  currency?: string;
  orderId?: string;
  clientId?: string;
  createdById?: string;
  email?: string;
  returnUrl?: string;
  cancelUrl?: string;
}) {
  if (input.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { paymentIntents: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.paymentStatus === "PAID" || order.paymentIntents.some((payment) => payment.status === "PAID")) {
      throw new ApiError(409, "This order has already been paid.");
    }

    const activeIntent = order.paymentIntents.find((payment) => ["INITIALIZED", "PENDING", "AUTHORIZED"].includes(payment.status));
    if (activeIntent) {
      return prisma.paymentIntent.findUnique({ where: { id: activeIntent.id }, include: { checkoutSessions: true } });
    }
  }

  const reference = await nextReference("Payment Reference");
  const currency = input.currency ?? "GHS";
  const orderClient = !input.clientId && input.orderId
    ? await prisma.order.findUnique({ where: { id: input.orderId }, select: { clientId: true } })
    : null;
  const clientId = input.clientId ?? orderClient?.clientId ?? undefined;
  const intent = await prisma.paymentIntent.create({
    data: {
      reference,
      amount: input.amount,
      currency,
      orderId: input.orderId,
      clientId,
      createdById: input.createdById,
      status: "INITIALIZED",
      metadata: { returnUrl: input.returnUrl, cancelUrl: input.cancelUrl },
    },
  });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const callbackUrl = new URL("/api/payments/verify", appUrl);
    callbackUrl.searchParams.set("reference", reference);
    if (input.returnUrl) callbackUrl.searchParams.set("returnUrl", input.returnUrl);
    const paystack = await initializePaystackTransaction({
      email: await resolvePaymentEmail({ ...input, clientId }),
      amount: input.amount,
      reference,
      currency,
      callbackUrl: callbackUrl.toString(),
      metadata: {
        orderId: input.orderId,
        clientId,
        paymentIntentId: intent.id,
      },
    });

    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "INITIALIZED",
        providerReference: paystack.reference,
        authorizationUrl: paystack.authorization_url,
        accessCode: paystack.access_code,
        checkoutSessions: {
          create: {
            status: "OPEN",
            checkoutUrl: paystack.authorization_url,
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
            orderId: input.orderId,
            clientId,
            createdById: input.createdById,
          },
        },
      },
      include: { checkoutSessions: true },
    });
  } catch (error) {
    return prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "PENDING",
        authorizationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/finance/transactions`,
        metadata: { returnUrl: input.returnUrl, cancelUrl: input.cancelUrl, initializationError: error instanceof Error ? error.message : "Paystack unavailable" },
        checkoutSessions: {
          create: {
            status: "OPEN",
            checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/finance/transactions`,
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
            orderId: input.orderId,
            clientId,
            createdById: input.createdById,
          },
        },
      },
      include: { checkoutSessions: true },
    });
  }
}

export async function applyPaystackVerification(data: PaystackVerifyData) {
  const amount = fromPaystackSubunit(data.amount);
  const status = mapStatus(data.status);
  const existingIntent = await prisma.paymentIntent.findUnique({ where: { reference: data.reference }, select: { status: true, paidAt: true } });
  const shouldSendReceipt = status === "PAID" && existingIntent?.status !== "PAID" && !existingIntent?.paidAt;
  const intent = await prisma.paymentIntent.update({
    where: { reference: data.reference },
    data: {
      status,
      providerReference: data.reference,
      channel: mapChannel(data.channel),
      amount,
      fees: fromPaystackSubunit(data.fees ?? 0),
      gatewayResponse: data.gateway_response,
      paidAt: data.paid_at ? new Date(data.paid_at) : status === "PAID" ? new Date() : null,
      checkoutSessions: status === "PAID"
        ? { updateMany: { where: { status: "OPEN" }, data: { status: "COMPLETED", completedAt: new Date() } } }
        : undefined,
    },
    include: { order: true, client: true, financeEntry: true },
  });

  if (intent.orderId && status === "PAID") {
    const nextCollected = Number(intent.order?.amountCollected ?? 0) + amount;
    const totalDue = Number(intent.order?.amountToCollect ?? 0);
    await prisma.order.update({
      where: { id: intent.orderId },
      data: {
        amountCollected: nextCollected,
        paymentStatus: totalDue > 0 && nextCollected < totalDue ? "PARTIAL" : "PAID",
        trackingEvents: {
          create: {
            status: intent.order?.status ?? "PENDING",
            location: intent.order?.city,
            note: `Payment received: ${intent.currency} ${amount.toFixed(2)} via ${mapChannel(data.channel).replaceAll("_", " ").toLowerCase()}.`,
          },
        },
      },
    });
  }

  if (status === "PAID" && !intent.financeEntry) {
    const entry = await createFinanceEntry({
      type: "COD_COLLECTION",
      party: intent.client?.businessName ?? data.customer?.email ?? "Customer",
      amount,
      orderId: intent.orderId ?? undefined,
      clientId: intent.clientId ?? undefined,
      notes: `Paystack payment ${data.reference}`,
    });
    await prisma.paymentIntent.update({ where: { id: intent.id }, data: { financeEntryId: entry.id } });
  }

  if (shouldSendReceipt) {
    await Promise.all([
      notifyClient(intent.clientId, {
        title: "Payment received",
        body: `${intent.currency} ${amount.toFixed(2)} was received for ${intent.order?.waybill ?? data.reference}.`,
        type: "PAYMENT",
        href: "/client/payments",
        metadata: intent.orderId ? { paymentIntentId: intent.id, orderId: intent.orderId } : { paymentIntentId: intent.id },
      }),
      notifyAdmins({
        title: "Payment received",
        body: `${intent.currency} ${amount.toFixed(2)} was paid for ${intent.order?.waybill ?? data.reference}.`,
        type: "PAYMENT",
        href: "/finance/transactions",
        metadata: intent.orderId ? { paymentIntentId: intent.id, orderId: intent.orderId } : { paymentIntentId: intent.id },
      }),
    ]);
  }

  if (shouldSendReceipt && intent.client?.email) {
    await sendPaymentReceiptEmail({
      to: intent.client.email,
      customerName: intent.client.businessName,
      reference: data.reference,
      amount,
      currency: intent.currency,
      channel: mapChannel(data.channel),
      waybill: intent.order?.waybill,
      paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
    });
  }

  return prisma.paymentIntent.findUnique({ where: { id: intent.id }, include: { checkoutSessions: true, financeEntry: true, order: true } });
}

export async function verifyAndApplyPayment(reference: string) {
  const data = await verifyPaystackTransaction(reference);
  return applyPaystackVerification(data);
}
