"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";

type OrderCancelButtonProps = {
  orderId: string;
  waybill: string;
  disabled?: boolean;
};

export function OrderCancelButton({ orderId, waybill, disabled }: OrderCancelButtonProps) {
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();

  async function cancel() {
    const confirmed = window.confirm(`Cancel order ${waybill}? This cannot be undone.`);
    if (!confirmed) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, { method: "PUT" });
      const result = await response.json();
      if (result.ok) {
        toast.success("Order cancelled", `${waybill} has been cancelled.`);
        window.location.reload();
      } else {
        toast.error("Cancel failed", result.error || "Unable to cancel order.");
      }
    } catch {
      toast.error("Cancel failed", "Network error while cancelling order.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" leftIcon={<Trash2 className="h-4 w-4 text-slate-500" />} onClick={cancel} disabled={cancelling || disabled}>
      {cancelling ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
