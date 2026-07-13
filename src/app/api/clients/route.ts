import { NextRequest } from "next/server";
import { created, handleApiError, ok } from "@/lib/api/response";
import { clientSchema } from "@/lib/api/validators/cms";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    return ok(await prisma.client.findMany({ orderBy: { businessName: "asc" }, include: { _count: { select: { orders: true } } } }));
  } catch {
    console.warn("Clients unavailable. Check DATABASE_URL connectivity.");
    return ok([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    return created(await prisma.client.create({ data: clientSchema.parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
