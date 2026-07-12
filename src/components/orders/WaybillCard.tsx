import { Order } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const DELIVERY_LABELS: Record<Order["deliveryType"], string> = {
  standard: "STANDARD",
  express: "EXPRESS",
  same_day: "SAME DAY",
  scheduled: "SCHEDULED",
  bulk: "BULK",
};

export function WaybillCard({ order }: { order: Order }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted">Tracking Code:</p>
          <p className="text-sm font-semibold text-text">{order.trackingCode}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-text-muted">Waybill number:</p>
          <p className="text-sm font-semibold text-text">{order.waybill}</p>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium text-text-muted">Date Picked:</p>
          <p className="text-sm text-text">{formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-text-muted">Hotline Number:</p>
          <p className="text-sm text-text">0244 904 104</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold text-text">Receiver Details</p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-text-muted">Name</dt>
              <dd className="text-text">{order.receiver.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Phone Number</dt>
              <dd className="text-text">{order.receiver.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Address Line 1</dt>
              <dd className="text-text">{order.receiver.addressLine1}</dd>
            </div>
            {order.receiver.addressLine2 && (
              <div>
                <dt className="text-xs text-text-muted">Address Line 2</dt>
                <dd className="text-text">{order.receiver.addressLine2}</dd>
              </div>
            )}
          </dl>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-text">Sender Details</p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-text-muted">Name</dt>
              <dd className="text-text">{order.sender.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Phone Number</dt>
              <dd className="text-text">{order.sender.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Address Line 1</dt>
              <dd className="text-text">{order.sender.addressLine1}</dd>
            </div>
            {order.sender.addressLine2 && (
              <div>
                <dt className="text-xs text-text-muted">Address Line 2</dt>
                <dd className="text-text">{order.sender.addressLine2}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs text-text-muted">Delivery Type</p>
          <p className="font-medium text-text">{DELIVERY_LABELS[order.deliveryType]}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Amount to collect</p>
          <p className="font-medium text-text">GH₵{order.amountToCollect}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Weight</p>
          <p className="font-medium text-text">{order.weightKg} kg</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
          SE
        </div>
        <div>
          <p className="text-sm font-bold text-danger">RESULT MATTERS!!!</p>
          <p className="text-xs text-text-muted">www.sankofaexpress.gh</p>
        </div>
      </div>
    </div>
  );
}
