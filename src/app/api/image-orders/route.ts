import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const schema = z.object({ label: z.string().min(2), submittedBy: z.string().min(2), senderPhone: z.string().min(6), clientId: z.string().optional(), images: z.array(z.string().url()).default([]) });

export async function GET() {
  try {
    return ok(await prisma.imageOrder.findMany({ include: { images: true, client: true, convertedOrder: true }, orderBy: { submittedAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    return created(await prisma.imageOrder.create({
      data: {
        label: input.label,
        submittedBy: input.submittedBy,
        senderPhone: input.senderPhone,
        clientId: input.clientId,
        itemCount: input.images.length,
        images: { create: input.images.map((url) => ({ url })) },
      },
      include: { images: true },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
