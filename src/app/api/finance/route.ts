import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return ok(await prisma.financeEntry.findMany({ include: { order: true, client: true, rider: true }, orderBy: { date: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}
