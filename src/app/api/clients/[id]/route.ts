import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { clientSchema } from "@/lib/api/validators/cms";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const client = await prisma.client.findUnique({ where: { id: (await params).id }, include: { orders: true, financeEntries: true } });
    return client ? ok(client) : fail(404, "Client not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.client.update({ where: { id: (await params).id }, data: clientSchema.partial().parse(await request.json()) }));
  } catch (error) {
    return handleApiError(error);
  }
}
