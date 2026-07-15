"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ReceiptActions() {
  function printReceipt() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3">
      <Link href="/client/payments" className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-text hover:bg-slate-50">
        <ArrowLeft className="h-4 w-4" />
        Payment History
      </Link>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={printReceipt}>Print</Button>
        <Button type="button" leftIcon={<Download className="h-4 w-4" />} onClick={printReceipt}>Download PDF</Button>
      </div>
    </div>
  );
}
