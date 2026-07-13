import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { getSettings } from "@/lib/services/settingsService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return ok(await getSettings());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = await prisma.appSetting.findFirst({
      where: { key: body.key, scope: body.scope ?? "GLOBAL", userId: null, clientId: null, riderId: null },
    });
    const setting = existing
      ? await prisma.appSetting.update({
          where: { id: existing.id },
          data: { value: body.value, label: body.label ?? body.key },
        })
      : await prisma.appSetting.create({
          data: { key: body.key, label: body.label ?? body.key, value: body.value, scope: body.scope ?? "GLOBAL" },
        });
    return ok(setting);
  } catch (error) {
    return handleApiError(error);
  }
}
