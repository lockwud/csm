import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { riderSchema } from "@/lib/api/validators/cms";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    return ok(await prisma.rider.findMany({ where: status ? { status: status as never } : undefined, orderBy: { name: "asc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await prisma.rider.create({ data: riderSchema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
