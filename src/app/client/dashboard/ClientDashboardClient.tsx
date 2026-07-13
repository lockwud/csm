"use client";

import { useEffect, useState } from "react";
import { Camera, Check, ChevronDown, CreditCard, MapPin, Minus, Package, Plus, QrCode, Smartphone, Trash2, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

const fallbackPaymentMethods = ["Cash", "Mobile Money", "Card"];
const fallbackOrderTypes = ["Standard", "Express"];
const fallbackPackageTypes = ["Package"];
const fallbackDeliveryZones = ["Accra"];

function toDeliveryType(label: string) {
  return label.toUpperCase().replaceAll(" ", "_");
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
  const [data, setData] = useState<PortalData | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Array<{ url: string; name: string }>>([]);
  const orderTypes = options.orderTypes.length ? options.orderTypes.map((item) => item.label) : fallbackOrderTypes;
  const packageTypes = options.packageTypes.length ? options.packageTypes.map((item) => item.label) : fallbackPackageTypes;
  const paymentMethods = options.paymentMethods.length ? options.paymentMethods.map((item) => item.label) : fallbackPaymentMethods;
  const deliveryZones = options.deliveryZones.length ? options.deliveryZones.map((item) => item.label) : fallbackDeliveryZones;
  const [deliveryType, setDeliveryType] = useState(orderTypes[0] ?? "Express");
  const [packageType, setPackageType] = useState(packageTypes[0] ?? "Package");
  const [destination, setDestination] = useState(deliveryZones[0] ?? "Accra");
  const [paymentBy, setPaymentBy] = useState("Sender");
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] ?? "Cash");
  const [senderPaymentMethod, setSenderPaymentMethod] = useState(paymentMethods[0] ?? "Cash");
  const [receiverPaymentMethod, setReceiverPaymentMethod] = useState(paymentMethods[0] ?? "Cash");
  const [splitPercent, setSplitPercent] = useState(50);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastConfirmation, setLastConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setData(result.data);
      })
      .catch(() => setMessage("Connection is unavailable."));
  }, []);

  useEffect(() => {
    setImages((current) => current.slice(0, quantity));
  }, [quantity]);

  useEffect(() => {
    const previews = images.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [images]);

  function isOnlinePayment(method: string) {
    return !["Cash", "COD", "Cash On Delivery"].includes(method);
  }

  async function createQuickOrder(formData: FormData) {
    setSaving(true);
    setMessage(null);
    if (!data?.client) {
      setSaving(false);
      setMessage("Client profile is required before creating orders.");
      return;
    }
    if (images.length !== quantity) {
      setSaving(false);
      setMessage(`Please upload ${quantity} package image${quantity === 1 ? "" : "s"} before creating this order.`);
      return;
    }
    const deliveryDestination = String(formData.get("destination") || destination);
    const description = String(formData.get("description") || packageType);
    const receiverName = String(formData.get("receiverName") || "");
    const receiverPhone = String(formData.get("receiverPhone") || "");
    const confirmationCode = `QR-${Date.now().toString().slice(-6)}`;
    const effectivePaymentMethod = paymentBy === "Split"
      ? `Sender:${senderPaymentMethod};Receiver:${receiverPaymentMethod}`
      : paymentMethod;
    let imageOrderId: string | undefined;

    if (images.length) {
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
        receiverAddress: { name: receiverName, phone: receiverPhone, addressLine1: deliveryDestination, city: deliveryDestination },
        items: [{ name: description, quantity }],
      }),
    });

    setSaving(false);
    if (response.ok) {
      const result = await response.json();
      const order = result.data as PortalOrder & { description?: string };
      const deliveryFee = Number(order.description?.match(/Delivery fee GHS ([0-9.]+)/)?.[1] ?? 0);
      const senderAmount = paymentBy === "Recipient" ? 0 : paymentBy === "Split" ? deliveryFee * (splitPercent / 100) : deliveryFee;
      const methodForSender = paymentBy === "Split" ? senderPaymentMethod : paymentMethod;
      if (senderAmount > 0 && isOnlinePayment(methodForSender)) {
        const paymentResponse = await fetch("/api/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            clientId: data.client.id,
            amount: senderAmount,
            currency: "GHS",
            returnUrl: `${window.location.origin}/client/quick-order`,
          }),
        });
        const paymentResult = await paymentResponse.json();
        const authorizationUrl = paymentResult.ok ? paymentResult.data.authorizationUrl : null;
        if (authorizationUrl) window.location.href = authorizationUrl;
      }
      setLastConfirmation(confirmationCode);
      setMessage(imageOrderId ? "Order and package images saved successfully." : "Order created successfully.");
      fetch("/api/client/dashboard", { cache: "no-store" })
        .then((item) => item.json())
        .then((result) => result.ok && setData(result.data));
    } else {
      setMessage("Unable to create order.");
    }
  }

  return (
    <div className="grid w-full gap-5" id="quick-order">
      <div>
        <h1 className="text-2xl font-black text-text">Quick Order</h1>
        <p className="mt-1 text-sm text-text-muted">Book, pay, and track a delivery from your client portal.</p>
      </div>

        <form action={createQuickOrder} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
          <div className="grid gap-6">
          <section>
            <h2 className="mb-3 text-lg font-bold">Quantity *</h2>
            <div className="flex items-center gap-7">
              <button type="button" className="text-3xl text-text-muted" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus /></button>
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
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-danger"
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
              <SoftSelect label="Delivery Zone" name="destination" value={destination} options={deliveryZones} onChange={setDestination} />
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
          </section> : null}

          {message ? <p className="font-bold text-brand">{message}</p> : null}
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
                </div>
              ) : (
                <div>
                  <QrCode className="mx-auto mb-2 h-14 w-14" />
                  <p className="text-xs font-bold text-text-muted">A confirmation code is added to each order for rider handoff verification.</p>
                </div>
              )}
            </div>
          </section>
          <Button type="submit" loading={saving}>Create Order</Button>
          </div>
        </form>

    </div>
  );
}
