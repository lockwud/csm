import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import type { JsonValue } from "@/lib/types/json";

const schema = z.object({
  label: z.string().min(1).optional(),
  active: z.boolean().optional(),
  value: z.unknown().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = schema.parse(await request.json());
    const data: { label?: string; active?: boolean; value?: JsonValue } = {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.value !== undefined ? { value: body.value as JsonValue } : {}),
    };

    return ok(await prisma.configurationItem.update({
      where: { id: (await params).id },
      data: data as never,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
