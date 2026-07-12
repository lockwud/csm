import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { createManifest } from "@/lib/services/dispatchService";

const schema = z.object({ zone: z.string().min(2), riderId: z.string().optional(), orderIds: z.array(z.string()).default([]) });

export async function GET() {
  try {
    return ok(await prisma.dispatchManifest.findMany({ include: { rider: true, stops: { include: { order: true } } }, orderBy: { createdAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await createManifest(schema.parse(await request.json())));
  } catch (error) {
    return handleApiError(error);
  }
}
