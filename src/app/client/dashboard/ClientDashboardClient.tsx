"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Camera, Check, ChevronDown, Copy, CreditCard, ExternalLink, MapPin, Minus, Package, Plus, QrCode, Share2, Smartphone, Trash2, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";
import { baseDeliveryZones, deliveryPointsByZone, pointForZone } from "@/lib/deliveryPoints";

type ClientOption = {
  id: string;
  label: string;
  value?: unknown;
};

type PortalOrder = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: string;
  deliveryType: string;
  city: string;
  receiverAddress: { name: string; city: string; addressLine1: string };
  rider?: { name: string; phone: string } | null;
};

type PortalData = {
  client: { id: string; businessName: string; contactName: string; phone: string; email?: string | null } | null;
  stats: { totalOrders: number; activeOrders: number; deliveredOrders: number; rewardPoints: number };
  orders: PortalOrder[];
};

type PriceQuote = {
  deliveryFee: number;
  baseFee: number;
  perKmFee: number;
  codFee: number;
  distanceKm: number;
  zoneName: string | null;
};

type CreatedOrder = PortalOrder & { description?: string };

type PaymentResult = {
  id: string;
  reference: string;
  amount: string | number;
  currency: string;
  status: string;
  authorizationUrl?: string | null;
  accessCode?: string | null;
};

type PaystackCallbackResponse = {
  reference: string;
  status?: string;
  transaction?: string;
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

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackInlineOptions) => { openIframe: () => void };
    };
  }
}

const fallbackPaymentMethods = ["Cash", "Mobile Money", "Card"];
const fallbackOrderTypes = ["Standard", "Express"];
const fallbackPackageTypes = ["Package"];
const fallbackDeliveryZones = ["Accra"];

function toDeliveryType(label: string) {
  return label.toUpperCase().replaceAll(" ", "_");
}

function isOfflinePayment(method: string) {
  return ["Cash", "COD", "Cash On Delivery"].includes(method);
}

function preferredOnlinePaymentMethod(methods: string[]) {
  return methods.find((method) => !isOfflinePayment(method)) ?? methods[0] ?? "Mobile Money";
}

function fileToDataUrl(file: File) {
  return new Promise<{ url: string; fileName: string; contentType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ url: String(reader.result), fileName: file.name, contentType: file.type });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function SoftSelect({
  label,
  value,
  options,
  onChange,
  name,
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  name?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <details className="group relative">
        <summary className="flex h-10 cursor-pointer list-none items-center justify-between rounded-lg bg-white px-3 text-sm font-bold text-text shadow-sm ring-1 ring-border transition hover:bg-slate-50 group-open:ring-2 group-open:ring-brand/20">
          <span className="truncate">{value}</span>
          <ChevronDown className="h-4 w-4 text-brand transition group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 right-0 z-30 mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={(event) => {
                onChange?.(option);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
              className={option === value ? "flex w-full items-center gap-3 rounded-lg bg-brand-light px-3 py-2 text-left text-sm font-bold text-brand" : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-muted hover:bg-slate-50 hover:text-brand"}
            >
              <Check className={option === value ? "h-4 w-4 opacity-100" : "h-4 w-4 opacity-0"} />
              {option}
            </button>
          ))}
        </div>
      </details>
    </label>
  );
}

export function ClientDashboardClient({ options }: { options: { orderTypes: ClientOption[]; packageTypes: ClientOption[]; paymentMethods: ClientOption[]; deliveryZones: ClientOption[] } }) {
  const toast = useToast();
  const [data, setData] = useState<PortalData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const orderTypes = options.orderTypes.length ? options.orderTypes.map((item) => item.label) : fallbackOrderTypes;
  const packageTypes = options.packageTypes.length ? options.packageTypes.map((item) => item.label) : fallbackPackageTypes;
  const paymentMethods = options.paymentMethods.length ? options.paymentMethods.map((item) => item.label) : fallbackPaymentMethods;
  const deliveryZones = baseDeliveryZones(options.deliveryZones.length ? options.deliveryZones.map((item) => item.label) : fallbackDeliveryZones);
  const [deliveryType, setDeliveryType] = useState(orderTypes[0] ?? "Express");
  const [packageType, setPackageType] = useState(packageTypes[0] ?? "Package");
  const [destination, setDestination] = useState(deliveryZones[0] ?? "Accra");
  const [dropoffPoint, setDropoffPoint] = useState(deliveryPointsByZone[deliveryZones[0] ?? "Accra"]?.[0]?.label ?? deliveryZones[0] ?? "Accra");
  const [paymentBy, setPaymentBy] = useState("Sender");
  const [paymentMethod, setPaymentMethod] = useState(preferredOnlinePaymentMethod(paymentMethods));
  const [senderPaymentMethod, setSenderPaymentMethod] = useState(preferredOnlinePaymentMethod(paymentMethods));
  const [receiverPaymentMethod, setReceiverPaymentMethod] = useState(paymentMethods[0] ?? "Cash");
  const [splitPercent, setSplitPercent] = useState(50);
  const [saving, setSaving] = useState(false);
  const [submitStep, setSubmitStep] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [lastConfirmation, setLastConfirmation] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [createdAmountDue, setCreatedAmountDue] = useState(0);
  const [createdPaymentMethod, setCreatedPaymentMethod] = useState("");
  const [paymentIntent, setPaymentIntent] = useState<PaymentResult | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const imagePreviews = useMemo(() => images.map((file) => ({ url: URL.createObjectURL(file), name: file.name })), [images]);

  const selectedSenderMethod = paymentBy === "Split" ? senderPaymentMethod : paymentMethod;
  const selectedReceiverMethod = paymentBy === "Split" ? receiverPaymentMethod : paymentMethod;
  const senderAmount = useMemo(() => {
    const fee = Number(quote?.deliveryFee ?? 0);
    if (paymentBy === "Recipient") return 0;
    if (paymentBy === "Split") return Number((fee * (splitPercent / 100)).toFixed(2));
    return fee;
  }, [paymentBy, quote?.deliveryFee, splitPercent]);
  const receiverAmount = useMemo(() => {
    const fee = Number(quote?.deliveryFee ?? 0);
    if (paymentBy === "Recipient") return fee;
    if (paymentBy === "Split") return Number((fee - senderAmount).toFixed(2));
    return 0;
  }, [paymentBy, quote?.deliveryFee, senderAmount]);

  useEffect(() => {
    fetch("/api/client/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setData(result.data);
      })
      .catch(() => {
        setMessage("Connection is unavailable.");
        toast.error("Connection unavailable", "Could not load your latest client data.");
      });
  }, [toast]);

  useEffect(() => {
    return () => imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [imagePreviews]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const response = await fetch("/api/orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: destination,
            deliveryType: toDeliveryType(deliveryType),
            distanceKm: 5,
            weightKg: quantity,
            codAmount: 0,
          }),
        });
        const result = await response.json();
        if (active && result.ok) setQuote(result.data);
      } catch {
        if (active) setQuote(null);
      } finally {
        if (active) setQuoteLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [deliveryType, destination, quantity]);

  async function createQuickOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setSubmitStep("Checking order details...");
    setMessage(null);
    setPaymentIntent(null);
    setCreatedOrder(null);
    setCreatedAmountDue(0);
    setCreatedPaymentMethod("");
    if (!data?.client) {
      setSaving(false);
      setSubmitStep(null);
      setMessage("Client profile is required before creating orders.");
      toast.error("Profile required", "Complete your client profile before creating orders.");
      return;
    }
    if (images.length !== quantity) {
      setSaving(false);
      setSubmitStep(null);
      setMessage(`Please upload ${quantity} package image${quantity === 1 ? "" : "s"} before creating this order.`);
      toast.error("Images required", `Upload ${quantity} package image${quantity === 1 ? "" : "s"} before creating this order.`);
      return;
    }
    const deliveryDestination = String(formData.get("destination") || destination);
    const selectedDropoff = String(formData.get("dropoffPoint") || dropoffPoint || deliveryDestination);
    const dropoff = pointForZone(deliveryDestination, selectedDropoff);
    const description = String(formData.get("description") || packageType);
    const receiverName = String(formData.get("receiverName") || "");
    const receiverPhone = String(formData.get("receiverPhone") || "");
    const confirmationCode = `QR-${Date.now().toString().slice(-6)}`;
    const effectivePaymentMethod = paymentBy === "Split"
      ? `Sender:${senderPaymentMethod};Receiver:${receiverPaymentMethod}`
      : paymentMethod;
    let imageOrderId: string | undefined;

    if (images.length) {
      setSubmitStep("Uploading package images...");
      const imagePayload = await Promise.all(images.map(fileToDataUrl));
      const imageResponse = await fetch("/api/image-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: `${description} image order`,
          submittedBy: data.client.businessName,
          senderPhone: data.client.phone,
          images: imagePayload,
        }),
      });
      const imageResult = await imageResponse.json();
      if (imageResult.ok) imageOrderId = imageResult.data.id;
    }

    setSubmitStep("Creating courier order...");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageOrderId,
        deliveryType: toDeliveryType(deliveryType),
        city: deliveryDestination,
        description: `${description}. Package ${packageType}. Images ${images.length}/${quantity}.`,
        amountToCollect: 0,
        weightKg: quantity,
        itemValue: 0,
        paymentBy,
        paymentMethod: effectivePaymentMethod,
        senderSharePercent: splitPercent,
        confirmationCode,
        senderAddress: {
          name: data.client.businessName,
          phone: data.client.phone,
          addressLine1: data.client.contactName,
          city: deliveryDestination,
        },
        receiverAddress: {
          name: receiverName,
          phone: receiverPhone,
          addressLine1: selectedDropoff,
          city: deliveryDestination,
          region: selectedDropoff,
          latitude: dropoff?.latitude,
          longitude: dropoff?.longitude,
        },
        items: [{ name: description, quantity }],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const order = result.data as CreatedOrder;
      setCreatedOrder(order);
      const deliveryFee = Number(order.description?.match(/Delivery fee GHS ([0-9.]+)/)?.[1] ?? quote?.deliveryFee ?? 0);
      const amountDueNow = paymentBy === "Recipient" ? 0 : paymentBy === "Split" ? Number((deliveryFee * (splitPercent / 100)).toFixed(2)) : deliveryFee;
      const methodForSender = paymentBy === "Split" ? senderPaymentMethod : paymentMethod;
      setCreatedAmountDue(amountDueNow);
      setCreatedPaymentMethod(methodForSender);
      if (amountDueNow > 0 && !isOfflinePayment(methodForSender)) {
      setSubmitStep("Initializing payment checkout...");
      const paymentResponse = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          clientId: data.client.id,
          amount: amountDueNow,
          currency: "GHS",
          returnUrl: `${window.location.origin}${window.location.pathname}`,
        }),
      });
      const paymentResult = await paymentResponse.json();
      if (paymentResult.ok) {
        setPaymentIntent(paymentResult.data);
        setPaymentModalOpen(true);
        setMessage("Order created. Complete payment in the secure Paystack checkout.");
        toast.success("Order created", `${order.waybill} is ready. Complete payment to continue.`);
      } else {
        setMessage("Order created, but payment checkout could not be initialized.");
        toast.warning("Payment not initialized", "The order was created, but Paystack checkout could not start.");
      }
      } else if (amountDueNow > 0) {
        setMessage("Order created. Cash/COD is offline, so Paystack checkout will not open. Choose Mobile Money, Card, or Bank Transfer to pay online.");
        toast.success("Order created", `${order.waybill} was created for offline collection.`);
      } else if (receiverAmount > 0) {
        setMessage("Order created. Receiver payment details are saved for collection.");
        toast.success("Order created", `${order.waybill} was created. Receiver payment was saved.`);
      } else {
        setMessage("Order created successfully.");
        toast.success("Order created", `${order.waybill} was created successfully.`);
      }
      setLastConfirmation(confirmationCode);
      fetch("/api/client/dashboard", { cache: "no-store" })
        .then((item) => item.json())
        .then((result) => result.ok && setData(result.data));
    } else {
      setMessage("Unable to create order.");
      toast.error("Order failed", "Unable to create this order. Please try again.");
    }
    setSaving(false);
    setSubmitStep(null);
  }

  async function copyConfirmation() {
    if (!lastConfirmation) return;
    await navigator.clipboard?.writeText(lastConfirmation);
    setMessage("Receiver confirmation code copied.");
    toast.success("Code copied", "Receiver confirmation code copied.");
  }

  async function shareConfirmation() {
    if (!lastConfirmation) return;
    const text = `Sankofa Express delivery confirmation code: ${lastConfirmation}${createdOrder ? ` for ${createdOrder.waybill}` : ""}`;
    if (navigator.share) {
      await navigator.share({ title: "Delivery confirmation code", text }).catch(() => null);
    } else {
      await navigator.clipboard?.writeText(text);
      setMessage("Receiver confirmation details copied for sharing.");
      toast.success("Share details copied", "Receiver confirmation details copied.");
    }
  }

  function loadPaystackInline() {
    return new Promise<void>((resolve, reject) => {
      if (window.PaystackPop) {
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

  async function openPaystackModal() {
    if (!paymentIntent || !data?.client) return;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setMessage("Paystack public key is missing. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment.");
      toast.error("Paystack key missing", "Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to use checkout.");
      return;
    }

    setPaymentProcessing(true);
    toast.info("Opening Paystack", "Preparing secure checkout.");
    try {
      await loadPaystackInline();
      const checkout = window.PaystackPop?.setup({
        key: publicKey,
        email: data.client.email || "payments@sankofaexpress.local",
        amount: Math.round(Number(paymentIntent.amount) * 100),
        currency: paymentIntent.currency || "GHS",
        ref: paymentIntent.reference,
        metadata: {
          paymentIntentId: paymentIntent.id,
          orderId: createdOrder?.id,
          clientId: data.client.id,
        },
        callback: async (response) => {
          setMessage("Verifying payment...");
          const verifyResponse = await fetch(`/api/payments/verify?reference=${encodeURIComponent(response.reference)}`, { cache: "no-store" });
          const verifyResult = await verifyResponse.json().catch(() => null);
          if (verifyResponse.ok && verifyResult?.ok) {
            setMessage("Payment successful. Your order is now paid.");
            toast.success("Payment successful", "Your payment has been verified.");
            setPaymentModalOpen(false);
            fetch("/api/client/dashboard", { cache: "no-store" })
              .then((item) => item.json())
              .then((result) => result.ok && setData(result.data));
          } else {
            setMessage("Payment was submitted, but verification could not be completed.");
            toast.warning("Verification pending", "Payment was submitted, but verification did not complete.");
          }
          setPaymentProcessing(false);
        },
        onClose: () => {
          setPaymentProcessing(false);
          setMessage("Paystack checkout was closed. You can reopen it from the payment panel.");
          toast.info("Checkout closed", "You can reopen Paystack from the payment panel.");
        },
      });
      checkout?.openIframe();
    } catch {
      setMessage("Unable to open Paystack checkout modal.");
      toast.error("Checkout failed", "Unable to open Paystack checkout.");
      setPaymentProcessing(false);
    }
  }

  async function payCreatedOrder() {
    if (!createdOrder || !data?.client) return;
    if (paymentIntent) {
      setPaymentModalOpen(true);
      return;
    }
    if (createdAmountDue <= 0) {
      setMessage("No sender payment is due for this order.");
      return;
    }
    if (isOfflinePayment(createdPaymentMethod)) {
      setMessage("This order uses an offline payment method, so Paystack checkout is not available.");
      return;
    }

    setPaymentProcessing(true);
    setMessage("Preparing Paystack payment...");
    const response = await fetch("/api/payments/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: createdOrder.id,
        clientId: data.client.id,
        amount: createdAmountDue,
        currency: "GHS",
        returnUrl: `${window.location.origin}${window.location.pathname}`,
      }),
    });
    const result = await response.json().catch(() => null);
    setPaymentProcessing(false);
    if (!response.ok || !result?.ok) {
      setMessage(result?.error?.message ?? "Unable to initialize Paystack payment.");
      toast.error("Payment failed", result?.error?.message ?? "Unable to initialize Paystack payment.");
      return;
    }
    setPaymentIntent(result.data);
    setPaymentModalOpen(true);
    setMessage("Paystack payment is ready. Complete checkout in the modal.");
  }

  async function cancelCreatedOrder() {
    if (!createdOrder?.id) return;
    const confirmed = window.confirm(`Cancel order ${createdOrder.waybill}? This cannot be undone.`);
    if (!confirmed) return;
    setCancelling(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/orders/${createdOrder.id}/cancel`, { method: "PUT" });
      const result = await response.json();
      if (result.ok) {
        setCreatedOrder((current) => current ? { ...current, status: "CANCELLED" } : null);
        setMessage("Order cancelled successfully.");
        toast.success("Order cancelled", `${createdOrder.waybill} has been cancelled.`);
      } else {
        setMessage(result.error || "Unable to cancel order.");
        toast.error("Cancel failed", result.error || "Unable to cancel order.");
      }
    } catch {
      setMessage("Network error while cancelling order.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="grid w-full gap-5" id="quick-order">
      <div>
        <h1 className="text-2xl font-black text-text">Quick Order</h1>
        <p className="mt-1 text-sm text-text-muted">Book, pay, and track a delivery from your client portal.</p>
      </div>

        <form onSubmit={createQuickOrder} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="grid gap-6">
          <section>
            <h2 className="mb-3 text-lg font-bold">Quantity *</h2>
            <div className="flex items-center gap-7">
              <button type="button" className="text-3xl text-text-muted" onClick={() => {
                setQuantity((value) => {
                  const next = Math.max(1, value - 1);
                  setImages((current) => current.slice(0, next));
                  return next;
                });
              }}><Minus /></button>
              <div className="grid h-16 w-20 place-items-center rounded-xl border border-border bg-white text-2xl font-bold">{quantity}</div>
              <button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white" onClick={() => setQuantity((value) => value + 1)}><Plus /></button>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Delivery Setup</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <SoftSelect label="Order Type" value={deliveryType} options={orderTypes} onChange={setDeliveryType} />
              <SoftSelect label="Package Type" value={packageType} options={packageTypes} onChange={setPackageType} />
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Package Images</h2>
            <p className="text-text-muted">Upload images of the items you want to send. Number of images must match the quantity.</p>
            {images.length !== quantity ? (
              <div className="rounded-xl border border-danger/30 bg-danger-light p-4 font-bold text-danger">Quantity: {quantity}, Images: {images.length}. Please upload {quantity} images.</div>
            ) : null}
            {imagePreviews.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imagePreviews.map((preview, index) => (
                  <div key={preview.url} className="relative overflow-hidden rounded-xl border border-border bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.url} alt={preview.name} className="h-36 w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <p className="truncate px-3 py-2 text-xs font-semibold text-text-muted">{preview.name}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {images.length < quantity ? (
              <label className="grid h-44 cursor-pointer place-items-center rounded-2xl border-2 border-brand bg-slate-300 text-center text-white">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const selected = Array.from(event.target.files ?? []);
                    setImages((current) => [...current, ...selected].slice(0, quantity));
                    event.currentTarget.value = "";
                  }}
                />
                <span>Tap to select image</span>
                <Camera className="absolute mt-24 h-10 w-10" />
              </label>
            ) : null}
          </section>

          <section className="rounded-2xl border border-brand/20 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand"><MapPin className="h-5 w-5" /> Delivery Destination *</h2>
            <div className="grid gap-3">
              <input name="receiverName" required placeholder="Receiver name" className="h-10 w-full rounded-lg bg-slate-100 px-3 text-sm outline-none" />
              <input name="receiverPhone" required placeholder="Receiver phone" className="h-10 w-full rounded-lg bg-slate-100 px-3 text-sm outline-none" />
              <SoftSelect label="Delivery Zone" name="destination" value={destination} options={deliveryZones} onChange={(value) => {
                setDestination(value);
                setDropoffPoint(deliveryPointsByZone[value]?.[0]?.label ?? value);
              }} />
              <SoftSelect label="Dropoff Point" name="dropoffPoint" value={dropoffPoint} options={(deliveryPointsByZone[destination] ?? [{ label: destination }]).map((item) => item.label)} onChange={setDropoffPoint} />
            </div>
          </section>

          <label className="grid gap-2">
            <span className="font-bold">Package Description</span>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-3">
              <Package className="h-6 w-6 text-text-muted" />
              <input name="description" placeholder="Describe your package" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </div>
          </label>
          </div>

          <div className="grid gap-6">
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Price Estimate</h2>
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-text-muted">{quoteLoading ? "Calculating..." : `${deliveryType} to ${destination}`}</span>
                <strong className="text-xl text-brand">GHS {(quote?.deliveryFee ?? 0).toFixed(2)}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-text-muted">Base</p><strong>GHS {(quote?.baseFee ?? 0).toFixed(2)}</strong></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-text-muted">Distance</p><strong>{quote?.distanceKm ?? 5} km</strong></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-text-muted">Sender pays</p><strong>GHS {senderAmount.toFixed(2)}</strong></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-text-muted">Receiver pays</p><strong>GHS {receiverAmount.toFixed(2)}</strong></div>
              </div>
              <p className="text-xs text-text-muted">Final fee is saved from admin pricing rules when the order is created.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-brand/20 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand">Payment Point</h2>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {["Sender", "Recipient", "Split"].map((item) => (
                <button type="button" key={item} onClick={() => setPaymentBy(item)} className={paymentBy === item ? "rounded-xl border-2 border-brand bg-brand-light p-4 font-bold text-brand" : "rounded-xl border border-border p-4 font-bold text-text-muted"}>
                  <UserRound className="mr-2 inline h-4 w-4" /> {item}
                </button>
              ))}
            </div>
            {paymentBy === "Split" ? (
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-brand">
                  Sender share: {splitPercent}%
                  <input type="range" min={10} max={90} step={10} value={splitPercent} onChange={(event) => setSplitPercent(Number(event.target.value))} className="accent-brand" />
                  <span className="text-xs text-text-muted">Receiver share: {100 - splitPercent}%</span>
                </label>
                <div className="grid gap-3">
                  <SoftSelect label="Sender Method" value={senderPaymentMethod} options={paymentMethods} onChange={setSenderPaymentMethod} />
                  <SoftSelect label="Receiver Method" value={receiverPaymentMethod} options={paymentMethods} onChange={setReceiverPaymentMethod} />
                </div>
                {!isOfflinePayment(senderPaymentMethod) ? (
                  <p className="rounded-lg bg-brand-light p-3 text-xs font-bold text-brand">Paystack checkout will open for the sender after the order is created.</p>
                ) : (
                  <p className="rounded-lg bg-slate-50 p-3 text-xs font-semibold text-text-muted">Cash/COD is collected offline and will not open Paystack checkout.</p>
                )}
              </div>
            ) : null}
          </section>

          {paymentBy !== "Split" ? <section className="rounded-2xl border border-brand/20 bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-brand">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {paymentMethods.map((label) => {
                const Icon = label.includes("Mobile") ? Smartphone : label.includes("Card") || label.includes("Wallet") ? Wallet : CreditCard;
                return (
                  <button type="button" key={label} onClick={() => setPaymentMethod(label)} className={paymentMethod === label ? "rounded-xl border-2 border-brand bg-brand-light p-4 text-sm font-bold text-brand" : "rounded-xl border border-border p-4 text-sm font-bold text-text-muted"}>
                    <Icon className="mx-auto mb-2 h-5 w-5" /> {label}
                  </button>
                );
              })}
            </div>
            {!isOfflinePayment(paymentMethod) ? (
              <p className="mt-3 rounded-lg bg-brand-light p-3 text-xs font-bold text-brand">Paystack checkout will open after the order is created so you can enter card or mobile money details.</p>
            ) : (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-semibold text-text-muted">Cash/COD is collected offline and will not open Paystack checkout.</p>
            )}
          </section> : null}

          {saving && submitStep ? (
            <div className="rounded-xl border border-brand/20 bg-brand-light p-4 text-sm font-bold text-brand">
              {submitStep}
            </div>
          ) : null}
          {message ? <p className="rounded-xl bg-white p-3 font-bold text-brand shadow-sm ring-1 ring-border">{message}</p> : null}
          {createdOrder ? (
            <section className="rounded-2xl border border-border bg-white p-5">
              <h2 className="mb-3 text-lg font-bold">Order Created</h2>
              <div className="grid gap-2 text-sm">
                <p><strong>Waybill:</strong> {createdOrder.waybill}</p>
                <p><strong>Tracking:</strong> {createdOrder.trackingCode}</p>
                <p><strong>Payment due now:</strong> GHS {createdAmountDue.toFixed(2)} via {createdPaymentMethod || selectedSenderMethod}</p>
                {paymentBy === "Split" ? <p><strong>Receiver payment:</strong> GHS {receiverAmount.toFixed(2)} via {selectedReceiverMethod}</p> : null}
              </div>
              {paymentIntent ? (
                <button type="button" onClick={() => setPaymentModalOpen(true)} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
                  <ExternalLink className="h-4 w-4" />
                  Complete Payment
                </button>
              ) : null}
              <button type="button" onClick={payCreatedOrder} disabled={paymentProcessing || createdAmountDue <= 0 || isOfflinePayment(createdPaymentMethod)} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-success px-4 text-sm font-bold text-white hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-60">
                <CreditCard className="h-4 w-4" />
                Pay Now
              </button>
              {createdOrder && !["DELIVERED", "CANCELLED", "FAILED", "RETURNED"].includes(createdOrder.status) ? (
                <button type="button" onClick={cancelCreatedOrder} disabled={cancelling} className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-60">
                  Cancel Order
                </button>
              ) : null}
            </section>
          ) : null}
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><QrCode className="h-5 w-5 text-brand" /> Delivery Confirmation QR</h2>
            <div className="grid min-h-32 place-items-center rounded-xl bg-slate-50 p-4 text-center text-brand">
              {lastConfirmation ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(lastConfirmation)}`}
                    alt={`Confirmation QR ${lastConfirmation}`}
                    className="mx-auto mb-3 h-28 w-28 rounded-md bg-white p-2"
                  />
                  <p className="font-mono text-sm font-bold">{lastConfirmation}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Button type="button" size="sm" variant="secondary" leftIcon={<Copy className="h-4 w-4" />} onClick={copyConfirmation}>Copy Code</Button>
                    <Button type="button" size="sm" variant="outline" leftIcon={<Share2 className="h-4 w-4" />} onClick={shareConfirmation}>Share</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <QrCode className="mx-auto mb-2 h-14 w-14" />
                  <p className="text-xs font-bold text-text-muted">A confirmation code is added to each order for rider handoff verification.</p>
                </div>
              )}
            </div>
          </section>
          <Button type="submit" loading={saving} disabled={saving || images.length !== quantity}>
            {saving ? "Creating Order..." : !isOfflinePayment(selectedSenderMethod) && senderAmount > 0 ? "Create Order & Pay" : "Create Order"}
          </Button>
          </div>
        </form>

      {paymentModalOpen && paymentIntent ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-black text-text">Complete Payment</h2>
              <p className="mt-1 text-sm text-text-muted">Paystack checkout will open in a secure payment modal.</p>
            </div>
            <div className="grid gap-4 p-5">
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-bold">Amount</p>
                <p className="mt-1 text-2xl font-black text-brand">GHS {Number(paymentIntent.amount).toFixed(2)}</p>
                <p className="mt-2 text-xs text-text-muted">Reference: {paymentIntent.reference}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)} disabled={paymentProcessing}>Cancel</Button>
                <Button type="button" loading={paymentProcessing} onClick={openPaystackModal}>
                  Open Paystack
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
