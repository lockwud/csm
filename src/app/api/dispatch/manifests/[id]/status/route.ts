import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ status: z.enum(["DRAFT", "READY", "ON_ROUTE", "COMPLETED", "CANCELLED"]) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.dispatchManifest.update({ where: { id: (await params).id }, data: schema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
