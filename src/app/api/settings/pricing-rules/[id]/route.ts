import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  zoneId: z.string().optional().nullable(),
  deliveryType: z.enum(["STANDARD", "EXPRESS", "SAME_DAY", "SCHEDULED", "BULK"]).optional(),
  baseFee: z.coerce.number().optional(),
  perKmFee: z.coerce.number().optional(),
  codFeePercent: z.coerce.number().optional(),
  maxWeightKg: z.coerce.number().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await prisma.pricingRule.update({ where: { id }, data: schema.parse(await request.json()), include: { zone: true } }));
  } catch (error) {
    return handleApiError(error);
  }
}
