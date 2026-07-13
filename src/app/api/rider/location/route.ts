import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const input = schema.parse(await request.json());
    const riderId = session?.riderId;

    if (riderId) {
      const existing = await prisma.appSetting.findFirst({ where: { key: "live_location", scope: "RIDER", riderId } });
      if (existing) await prisma.appSetting.update({ where: { id: existing.id }, data: { value: input } });
      else await prisma.appSetting.create({ data: { key: "live_location", label: "Live Rider Location", scope: "RIDER", riderId, value: input } });
    }

    return ok({ saved: Boolean(riderId), location: input });
  } catch (error) {
    return handleApiError(error);
  }
}
