import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { quoteDelivery } from "@/lib/services/pricingService";

const schema = z.object({
  city: z.string().min(2),
  deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).default("STANDARD"),
  distanceKm: z.coerce.number().min(0).optional(),
  weightKg: z.coerce.number().min(0).optional(),
  codAmount: z.coerce.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    return ok(await quoteDelivery(schema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
