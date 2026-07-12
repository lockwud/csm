import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const report = await prisma.reportTemplate.findUnique({ where: { id: (await params).id }, include: { runs: true } });
    return report ? ok(report) : fail(404, "Report not found");
  } catch (error) {
    return handleApiError(error);
  }
}
