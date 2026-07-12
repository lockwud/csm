import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";

const schema = z.object({ latitude: z.coerce.number(), longitude: z.coerce.number() });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok({ riderId: (await params).id, location: schema.parse(await request.json()), updatedAt: new Date().toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}
