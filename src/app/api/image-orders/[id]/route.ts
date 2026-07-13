import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const imageOrder = await prisma.imageOrder.findUnique({ where: { id: (await params).id }, include: { images: true, convertedOrder: true } });
    return imageOrder ? ok(imageOrder) : fail(404, "Image order not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.imageOrder.update({ where: { id: (await params).id }, data: await request.json() }));
  } catch (error) {
    return handleApiError(error);
  }
}
