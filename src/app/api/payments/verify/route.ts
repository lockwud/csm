import { NextRequest } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference") ?? "";
    return ok(await prisma.paymentIntent.findUnique({ where: { reference } }));
  } catch (error) {
    return handleApiError(error);
  }
}
