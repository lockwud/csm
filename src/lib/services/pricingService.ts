import type { DeliveryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PriceInput = {
  city: string;
  deliveryType: DeliveryType;
  distanceKm?: number;
  weightKg?: number;
  codAmount?: number;
};

export type PriceQuote = {
  deliveryFee: number;
  baseFee: number;
  perKmFee: number;
  codFee: number;
  distanceKm: number;
  zoneName: string | null;
  ruleId: string | null;
};

export async function quoteDelivery(input: PriceInput): Promise<PriceQuote> {
  const distanceKm = Math.max(1, Number(input.distanceKm ?? 5));
  const zone = await prisma.serviceZone.findFirst({
    where: {
      active: true,
      OR: [
        { city: { equals: input.city, mode: "insensitive" } },
        { name: { equals: input.city, mode: "insensitive" } },
      ],
    },
    include: { pricingRules: { where: { active: true, deliveryType: input.deliveryType }, take: 1 } },
  });

  const rule = zone?.pricingRules[0] ?? await prisma.pricingRule.findFirst({
    where: { active: true, deliveryType: input.deliveryType, zoneId: null },
    orderBy: { createdAt: "desc" },
  });

  const baseFee = Number(rule?.baseFee ?? zone?.baseFee ?? 25);
  const perKmFee = Number(rule?.perKmFee ?? 0);
  const codPercent = Number(rule?.codFeePercent ?? 0);
  const codFee = (Number(input.codAmount ?? 0) * codPercent) / 100;
  const weightSurcharge = Math.max(0, Number(input.weightKg ?? 0) - Number(rule?.maxWeightKg ?? 10)) * 2;

  return {
    deliveryFee: Number((baseFee + perKmFee * distanceKm + codFee + weightSurcharge).toFixed(2)),
    baseFee,
    perKmFee,
    codFee: Number(codFee.toFixed(2)),
    distanceKm,
    zoneName: zone?.name ?? null,
    ruleId: rule?.id ?? null,
  };
}
