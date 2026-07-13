import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError } from "@/lib/api/response";
import { createFinanceEntry } from "@/lib/services/financeService";

const schema = z.object({
  type: z.enum(["COD_COLLECTION", "CLIENT_PAYOUT", "RIDER_PAYOUT", "INVOICE", "REFUND", "ADJUSTMENT"]),
  party: z.string().min(2),
  amount: z.coerce.number().positive(),
  orderId: z.string().optional(),
  clientId: z.string().optional(),
  riderId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    return created(await createFinanceEntry(schema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
