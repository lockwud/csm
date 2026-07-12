import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: (await params).id }, include: { order: true, client: true, owner: true } });
    return ticket ? ok(ticket) : fail(404, "Ticket not found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await prisma.supportTicket.update({ where: { id: (await params).id }, data: await request.json() }));
  } catch (error) {
    return handleApiError(error);
  }
}
