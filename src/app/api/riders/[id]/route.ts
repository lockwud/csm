import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { riderSchema } from "@/lib/api/validators/cms";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rider = await prisma.rider.findUnique({ where: { id: (await params).id }, include: { orders: true, manifests: true } });
    return rider ? ok(rider) : fail(404, "Rider not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.rider.update({ where: { id: (await params).id }, data: riderSchema.partial().parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
