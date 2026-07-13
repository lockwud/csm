import { prisma } from "@/lib/prisma";
import { nextReference } from "@/lib/services/referenceService";

export async function createManifest(input: { zone: string; riderId?: string; orderIds?: string[] }) {
  return prisma.dispatchManifest.create({
    data: {
      code: await nextReference("Dispatch Manifest"),
      zone: input.zone,
      riderId: input.riderId,
      capacity: input.orderIds?.length ?? 0,
      stops: {
        create: input.orderIds?.map((orderId, index) => ({ orderId, sequence: index + 1 })) ?? [],
      },
    },
    include: { stops: { include: { order: true } }, rider: true },
  });
}
