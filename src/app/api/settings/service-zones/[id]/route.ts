import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  region: z.string().optional().nullable(),
  baseFee: z.coerce.number().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await prisma.serviceZone.update({ where: { id }, data: schema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
