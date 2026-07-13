import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ message: z.string().min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = schema.parse(await request.json());
    return ok(await prisma.supportTicket.update({ where: { id: (await params).id }, data: { lastUpdate: input.message } }));
  } catch (error) {
    return handleApiError(error);
  }
}
