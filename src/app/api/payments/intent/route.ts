import { NextRequest } from "next/server";
import { created, handleApiError } from "@/lib/api/response";
import { paymentIntentSchema } from "@/lib/api/validators/payments";
import { getSession } from "@/lib/auth/session";
import { createPaymentIntent } from "@/lib/services/paymentService";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const input = paymentIntentSchema.parse(await request.json());
    return created(await createPaymentIntent({ ...input, createdById: session?.sub }));
  } catch (error) {
    return handleApiError(error);
  }
}
