import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return ok(await prisma.rewardLedger.findMany({ include: { client: true, order: true }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}
