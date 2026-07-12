import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [pending, settled, flagged] = await prisma.$transaction([
      prisma.financeEntry.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
      prisma.financeEntry.aggregate({ _sum: { amount: true }, where: { status: "SETTLED" } }),
      prisma.financeEntry.count({ where: { status: "FLAGGED" } }),
    ]);
    return ok({ pending: pending._sum.amount ?? 0, settled: settled._sum.amount ?? 0, flagged });
  } catch (error) {
    return handleApiError(error);
  }
}
