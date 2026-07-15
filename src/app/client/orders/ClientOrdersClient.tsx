"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/providers/ToastProvider";

type ClientOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  paymentStatus: string;
  direction: "Sending" | "Receiving";
  route: string;
  rider: { name: string; phone: string } | null;
  latestPayment: { id: string; reference: string; amount: number; currency: string; status: string; authorizationUrl?: string | null } | null;
  amountDueNow: number;
  canCancel: boolean;
};

type PaymentIntent = {
  id: string;
  reference: string;
  amount: string | number;
  currency: string;
  status: string;
  authorizationUrl?: string | null;
};

type PaystackCallbackResponse = {
  reference: string;
};

type PaystackInlineOptions = {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback: (response: PaystackCallbackResponse) => void;
  onClose: () => void;
};

type PaystackWindow = Window & {
  PaystackPop?: {
    setup: (options: PaystackInlineOptions) => { openIframe: () => void };
  };
};

function loadPaystackInline() {
  return new Promise<void>((resolve, reject) => {
    const paystackWindow = window as PaystackWindow;
    if (paystackWindow.PaystackPop) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Paystack checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Paystack checkout."));
    document.body.appendChild(script);
  });
}

export function ClientOrdersClient({ orders, client }: { orders: ClientOrder[]; client: { id: string; email: string } | null }) {
  const toast = useToast();
  const [visibleOrders, setVisibleOrders] = useState(orders);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function startPayment(order: ClientOrder) {
    if (!client?.email) {
      toast.error("Email required", "We could not find your account email for payment.");
      return;
    }
    if (order.amountDueNow <= 0) {
      toast.error("Payment amount unavailable", "This order does not have a sender payment amount to collect.");
      return;
    }
    setLoadingOrderId(order.id);
    toast.info("Preparing payment", `Creating checkout for ${order.waybill}.`);

    if (order.latestPayment && ["INITIALIZED", "PENDING", "AUTHORIZED"].includes(order.latestPayment.status)) {
      setSelectedOrder(order);
      setPaymentIntent(order.latestPayment);
      setLoadingOrderId(null);
      return;
    }

    const response = await fetch("/api/payments/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        clientId: client.id || undefined,
        amount: order.amountDueNow,
        currency: "GHS",
        returnUrl: `${window.location.origin}/client/orders`,
      }),
    });
    const result = await response.json().catch(() => null);
    setLoadingOrderId(null);
    if (!response.ok || !result?.ok) {
      toast.error("Payment failed", result?.error?.message ?? "Unable to initialize payment.");
      return;
    }
    setSelectedOrder(order);
    setPaymentIntent(result.data);
    toast.success("Checkout ready", "Complete the payment in the secure modal.");
  }

  async function openPaystackPopup() {
    if (!paymentIntent || !selectedOrder || !client) return;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      if (paymentIntent.authorizationUrl) {
        window.location.href = paymentIntent.authorizationUrl;
        return;
      }
      toast.error("Paystack key missing", "Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to use checkout.");
      return;
    }
    try {
      await loadPaystackInline();
      const paystackWindow = window as PaystackWindow;
      const checkout = paystackWindow.PaystackPop?.setup({
        key: publicKey,
        email: client.email,
        amount: Math.round(Number(paymentIntent.amount) * 100),
        currency: paymentIntent.currency || "GHS",
        ref: paymentIntent.reference,
        metadata: { orderId: selectedOrder.id, paymentIntentId: paymentIntent.id, clientId: client.id },
        callback: async (response) => {
          await verifyPayment(response.reference);
        },
        onClose: () => toast.info("Checkout closed", "You can reopen checkout from this payment panel."),
      });
      checkout?.openIframe();
    } catch {
      if (paymentIntent.authorizationUrl) {
        toast.info("Opening Paystack", "Redirecting to secure Paystack checkout.");
        window.location.href = paymentIntent.authorizationUrl;
        return;
      }
      toast.error("Checkout failed", "Unable to open Paystack checkout.");
    }
  }

  async function verifyPayment(reference = paymentIntent?.reference) {
    if (!reference) return;
    setVerifying(true);
    toast.info("Verifying payment", "Checking Paystack payment status.");
    const response = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, { cache: "no-store" });
    const result = await response.json().catch(() => null);
    setVerifying(false);
    if (response.ok && result?.ok) {
      toast.success("Payment confirmed", "Your order payment has been confirmed.");
      setVisibleOrders((current) => current.map((order) => order.id === selectedOrder?.id ? { ...order, paymentStatus: "PAID", amountDueNow: 0, latestPayment: paymentIntent ? { ...paymentIntent, amount: Number(paymentIntent.amount), status: "PAID" } : order.latestPayment } : order));
      setPaymentIntent(null);
      setSelectedOrder(null);
      return;
    }
    toast.warning("Payment not confirmed", result?.error?.message ?? "Complete checkout, then verify again.");
  }

  async function cancelOrder(order: ClientOrder) {
    const confirmed = window.confirm(`Cancel order ${order.waybill}? This cannot be undone.`);
    if (!confirmed) return;
    setLoadingOrderId(order.id);
    const response = await fetch(`/api/orders/${order.id}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Order cancelled from client orders page" }),
    });
    const result = await response.json().catch(() => null);
    setLoadingOrderId(null);
    if (!response.ok || !result?.ok) {
      toast.error("Cancel failed", result?.error?.message ?? result?.error ?? "Unable to cancel order.");
      return;
    }
    setVisibleOrders((current) => current.filter((item) => item.id !== order.id));
    toast.success("Order cancelled", `${order.waybill} has been cancelled.`);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-1 text-sm text-text-muted">Pending, processed, sent, and receiving packages.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <THead>
              <TR>
                <TH>Waybill</TH>
                <TH>Direction</TH>
                <TH>Route</TH>
                <TH>Status</TH>
                <TH>Payment</TH>
                <TH>Rider</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {visibleOrders.map((order) => {
                const canPay = order.direction === "Sending" && order.paymentStatus !== "PAID" && order.amountDueNow > 0;
                const canCancel = order.canCancel;
                return (
                  <TR key={order.id}>
                    <TD>
                      <Link href={`/track/${order.trackingCode}`} className="font-bold text-brand">{order.waybill}</Link>
                      <p className="text-xs text-text-muted">{order.trackingCode}</p>
                    </TD>
                    <TD>{order.direction}</TD>
                    <TD>{order.route}</TD>
                    <TD><Badge variant={order.status === "DELIVERED" ? "success" : order.status === "FAILED" ? "destructive" : "info"}>{order.status.replaceAll("_", " ")}</Badge></TD>
                    <TD>{order.paymentStatus}{order.latestPayment ? ` / ${order.latestPayment.status}` : ""}</TD>
                    <TD>{order.rider ? <a href={`tel:${order.rider.phone}`} className="font-semibold text-brand">{order.rider.name}</a> : "Unassigned"}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-2">
                        {canPay ? (
                          <Button type="button" size="sm" loading={loadingOrderId === order.id} leftIcon={<CreditCard className="h-4 w-4" />} onClick={() => startPayment(order)}>
                            Pay Now
                          </Button>
                        ) : null}
                        {canCancel ? (
                          <Button type="button" size="sm" variant="outline" loading={loadingOrderId === order.id} leftIcon={<Trash2 className="h-4 w-4 text-slate-500" />} onClick={() => cancelOrder(order)}>
                            Cancel
                          </Button>
                        ) : null}
                        {!canPay && !canCancel ? <span className="text-xs text-text-muted">-</span> : null}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {!visibleOrders.length ? <p className="p-6 text-sm text-text-muted">No orders match this filter.</p> : null}
        </CardContent>
      </Card>

      {paymentIntent && selectedOrder ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-black text-text">Complete Payment</h2>
              <p className="mt-1 text-sm text-text-muted">{selectedOrder.waybill}</p>
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-bold">Amount</p>
                <p className="mt-1 text-2xl font-black text-brand">GHS {Number(paymentIntent.amount).toFixed(2)}</p>
                <p className="mt-2 text-xs text-text-muted">Reference: {paymentIntent.reference}</p>
              </div>
              <div className="rounded-lg bg-brand-light p-4 text-sm font-semibold text-brand">
                Use the button below to open Paystack in its secure payment popup. Do not refresh this page until payment is verified.
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentIntent(null)}>Later</Button>
                <Button type="button" variant="secondary" loading={verifying} onClick={() => verifyPayment()}>
                  I&apos;ve Completed Payment
                </Button>
                <Button type="button" leftIcon={<CreditCard className="h-4 w-4" />} onClick={openPaystackPopup}>
                  Pay with Paystack
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
