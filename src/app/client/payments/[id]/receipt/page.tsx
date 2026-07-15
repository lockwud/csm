import { notFound } from "next/navigation";
import { CheckCircle2, CreditCard, PackageCheck, Route, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ReceiptActions } from "./ReceiptActions";

function money(amount: unknown, currency = "GHS") {
  return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
}

function dateTime(value?: Date | null) {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function statusVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (["FAILED", "ABANDONED"].includes(status)) return "destructive" as const;
  return "info" as const;
}

type ReceiptPageProps = { params: Promise<{ id: string }> };

export default async function PaymentReceiptPage({ params }: ReceiptPageProps) {
  const session = await getSession();
  if (!session) notFound();
  const user = await prisma.user.findUnique({ where: { id: session.sub }, include: { client: true } });
  if (!user) notFound();

  const payment = await prisma.paymentIntent.findUnique({
    where: { id: (await params).id },
    include: {
      client: true,
      order: {
        include: {
          senderAddress: true,
          receiverAddress: true,
          items: true,
          rider: true,
          trackingEvents: { orderBy: { happenedAt: "asc" } },
          convertedImageOrder: { include: { images: true } },
        },
      },
    },
  });
  if (!payment) notFound();

  const phone = user.phone ?? user.client?.phone;
  const clientId = user.clientId ?? session.clientId;
  const canView = payment.clientId === clientId
    || payment.order?.clientId === clientId
    || payment.order?.senderAddress.phone === phone
    || payment.order?.receiverAddress.phone === phone;
  if (!canView) notFound();

  const order = payment.order;
  const images = order?.convertedImageOrder?.images ?? [];
  const items = order?.items.length ? order.items : [{ id: "package", name: order?.description?.split(".")[0] || "Package", quantity: images.length || 1 }];

  return (
    <div className="grid gap-5">
      <ReceiptActions />

      <section id="payment-receipt" className="receipt-page w-full bg-white text-text">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <div className="receipt-header flex flex-wrap items-start justify-between gap-6 border-b border-border bg-white p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-brand">Sankofa Express</p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-text">Payment Receipt</h1>
              <p className="mt-2 max-w-xl text-sm text-text-muted">Courier payment confirmation, route details, and package evidence for this order.</p>
            </div>
            <div className="amount-box rounded-2xl bg-brand p-5 text-right text-white shadow-sm">
              <p className="text-xs uppercase text-white/70">Amount Paid</p>
              <p className="mt-1 text-3xl font-black">{money(payment.amount, payment.currency)}</p>
              <p className="mt-2 text-xs font-bold uppercase text-white/80">{payment.status}</p>
            </div>
          </div>

          <div className="receipt-meta grid gap-5 p-6 md:grid-cols-4">
            <Card className="p-4 md:col-span-2">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-brand"><CreditCard className="h-4 w-4" /> Transaction</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="block text-xs text-text-muted">Reference</span><strong>{payment.reference}</strong></p>
                <p><span className="block text-xs text-text-muted">Provider Ref</span><strong>{payment.providerReference ?? payment.reference}</strong></p>
                <p><span className="block text-xs text-text-muted">Channel</span><strong>{payment.provider} · {payment.channel.replaceAll("_", " ")}</strong></p>
                <p><span className="block text-xs text-text-muted">Paid At</span><strong>{dateTime(payment.paidAt)}</strong></p>
              </div>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase text-brand"><ShieldCheck className="h-4 w-4" /> Status</p>
              <div className="mt-4"><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></div>
              <p className="mt-3 text-xs text-text-muted">Gateway: {payment.gatewayResponse ?? "Awaiting gateway response"}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-black uppercase text-brand">Fees</p>
              <p className="mt-4 text-2xl font-black">{money(payment.fees, payment.currency)}</p>
              <p className="mt-1 text-xs text-text-muted">Processing fees recorded from gateway.</p>
            </Card>
          </div>

          {order ? (
            <div className="receipt-order border-t border-border p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-brand"><Route className="h-4 w-4" /> Order Overview</p>
                  <h2 className="mt-2 text-3xl font-black">{order.waybill}</h2>
                  <p className="text-sm text-text-muted">Tracking: {order.trackingCode}</p>
                </div>
                <Badge variant="info">{order.status.replaceAll("_", " ")}</Badge>
              </div>

              <div className="receipt-addresses mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase text-brand">Sender</p>
                  <strong className="mt-2 block">{order.senderAddress.name}</strong>
                  <p className="text-sm text-text-muted">{order.senderAddress.addressLine1}, {order.senderAddress.city}</p>
                  <p className="text-sm text-text-muted">{order.senderAddress.phone}</p>
                </div>
                <div className="rounded-2xl border border-border bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase text-brand">Receiver</p>
                  <strong className="mt-2 block">{order.receiverAddress.name}</strong>
                  <p className="text-sm text-text-muted">{order.receiverAddress.addressLine1}, {order.receiverAddress.city}</p>
                  <p className="text-sm text-text-muted">{order.receiverAddress.phone}</p>
                </div>
              </div>

              <div className="receipt-items mt-6 rounded-2xl border border-border p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase text-brand"><PackageCheck className="h-4 w-4" /> Smart Item Identification</p>
                <p className="mt-2 text-sm text-text-muted">Identified from order item records, package description, and uploaded image evidence.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="rounded-xl bg-slate-50 p-4 ring-1 ring-border">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-text-muted">Quantity: {item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {images.length ? (
                <div className="receipt-images mt-6">
                  <p className="text-xs font-black uppercase text-brand">Package Images</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {images.map((image, index) => (
                      <div key={image.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.fileName ?? `Package image ${index + 1}`} className="h-36 w-full object-cover" />
                        <p className="truncate px-3 py-2 text-xs font-semibold text-text-muted">{image.fileName ?? `Image ${index + 1}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="receipt-footer border-t border-border bg-slate-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div>
                <p className="font-black">Thank you for choosing Sankofa Express.</p>
                <p className="text-text-muted">This receipt is generated from live payment and order records.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-success-light px-4 py-2 font-bold text-success">
                <CheckCircle2 className="h-4 w-4" /> Verified Record
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
