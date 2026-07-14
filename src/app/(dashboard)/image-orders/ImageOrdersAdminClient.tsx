"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ImageIcon, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type ImageOrder = {
  id: string;
  label: string;
  submittedBy: string;
  senderPhone: string;
  itemCount: number;
  status: string;
  convertedOrderId: string | null;
  convertedOrder: { id: string; waybill: string; deliveryType: string } | null;
  images: Array<{ id: string; url: string; fileName: string | null; contentType: string | null }>;
};

export function ImageOrdersAdminClient({ initialOrders }: { initialOrders: ImageOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function processImageOrder(formData: FormData) {
    const id = String(formData.get("id"));
    setProcessingId(id);
    setMessage(null);
    const response = await fetch(`/api/image-orders/${id}/process`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryType: String(formData.get("deliveryType") || "STANDARD"),
        city: String(formData.get("city") || ""),
        receiverName: String(formData.get("receiverName") || ""),
        receiverPhone: String(formData.get("receiverPhone") || ""),
        receiverAddress: String(formData.get("receiverAddress") || ""),
        paymentBy: String(formData.get("paymentBy") || "Sender"),
        paymentMethod: String(formData.get("paymentMethod") || "Cash"),
      }),
    });
    const result = await response.json();
    setProcessingId(null);
    if (!result.ok) {
      setMessage("Unable to process image order.");
      return;
    }
    setOrders((current) => current.map((item) => item.id === id ? {
      ...item,
      status: "PROCESSED",
      convertedOrderId: result.data.id,
      convertedOrder: {
        id: result.data.id,
        waybill: result.data.waybill,
        deliveryType: result.data.deliveryType,
      },
    } : item));
    setMessage(`Image order converted to ${result.data.waybill}.`);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Image Orders</h1>
        <p className="text-sm text-text-muted">Review package photos and convert them into courier orders.</p>
      </div>
      {message ? <p className="rounded-md bg-brand-light px-4 py-3 text-sm font-bold text-brand">{message}</p> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {orders.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 font-bold"><ImageIcon className="h-4 w-4" /> {item.label}</h2>
                <p className="mt-1 text-sm text-text-muted">{item.submittedBy} · {item.senderPhone}</p>
                <p className="mt-2 text-sm font-semibold">{item.itemCount} image(s) · {item.status.replaceAll("_", " ")}</p>
              </div>
              {item.convertedOrderId ? <CheckCircle2 className="h-5 w-5 text-brand" /> : null}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {item.images.slice(0, 6).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={image.id} src={image.url} alt={image.fileName ?? item.label} className="h-24 w-full rounded-md object-cover ring-1 ring-border" />
              ))}
            </div>

            {item.convertedOrder ? (
              <div className="rounded-xl bg-brand-light p-4 text-sm">
                <p className="font-bold text-brand">Converted to courier order</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text">{item.convertedOrder.waybill}</p>
                    <p className="text-xs text-text-muted">{item.convertedOrder.deliveryType.replaceAll("_", " ")}</p>
                  </div>
                  <Link href={`/orders/${item.convertedOrder.id}`} className="rounded-md bg-brand px-3 py-2 text-xs font-bold text-white hover:bg-brand-dark">
                    View Order
                  </Link>
                </div>
              </div>
            ) : (
            <form action={processImageOrder} className="grid gap-3">
              <input type="hidden" name="id" value={item.id} />
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="receiverName" label="Receiver Name" placeholder="Receiver full name" required />
                <Input name="receiverPhone" label="Receiver Phone" placeholder="+233..." required />
                <Input name="city" label="Delivery City" placeholder="Delivery city" required />
                <Input name="receiverAddress" label="Receiver Address" placeholder="Delivery address" required />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <select name="deliveryType" className="h-11 rounded-md border border-border bg-white px-3 text-sm outline-none">
                  <option value="STANDARD">Standard</option>
                  <option value="EXPRESS">Express</option>
                  <option value="SAME_DAY">Same Day</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="BULK">Bulk</option>
                </select>
                <select name="paymentBy" className="h-11 rounded-md border border-border bg-white px-3 text-sm outline-none">
                  <option>Sender</option>
                  <option>Recipient</option>
                  <option>Split</option>
                </select>
                <select name="paymentMethod" className="h-11 rounded-md border border-border bg-white px-3 text-sm outline-none">
                  <option>Cash</option>
                  <option>Mobile Money</option>
                  <option>Card</option>
                </select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={processingId === item.id} leftIcon={<PackageCheck className="h-4 w-4" />}>
                  Convert to Order
                </Button>
              </div>
            </form>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
