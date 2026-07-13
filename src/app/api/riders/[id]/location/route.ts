import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ latitude: z.coerce.number(), longitude: z.coerce.number() });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const riderId = (await params).id;
    const location = schema.parse(await request.json());
    const existing = await prisma.appSetting.findFirst({ where: { key: "live_location", scope: "RIDER", riderId } });
    const saved = existing
      ? await prisma.appSetting.update({ where: { id: existing.id }, data: { value: location } })
      : await prisma.appSetting.create({ data: { key: "live_location", label: "Live Rider Location", scope: "RIDER", riderId, value: location } });
    return ok({ riderId, location: saved.value, updatedAt: saved.updatedAt });
  } catch (error) {
    return handleApiError(error);
  }
}
