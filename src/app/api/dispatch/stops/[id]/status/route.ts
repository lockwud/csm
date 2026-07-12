import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["PENDING", "ARRIVED", "COMPLETED", "FAILED", "SKIPPED"]), failedReason: z.string().optional() });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.parse(await request.json());
    return ok(await prisma.dispatchStop.update({ where: { id: (await params).id }, data: { ...input, completedAt: input.status === "COMPLETED" ? new Date() : undefined } }));
  } catch (error) {
    return handleApiError(error);
  }
}
