import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manifest = await prisma.dispatchManifest.findUnique({ where: { id: (await params).id }, include: { stops: { include: { order: true } }, rider: true } });
    return manifest ? ok(manifest) : fail(404, "Manifest not found");
  } catch (error) {
    return handleApiError(error);
  }
}
