import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return ok(await prisma.paymentIntent.findMany({ include: { order: true, client: true, checkoutSessions: true }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}
