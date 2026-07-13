import { NextRequest } from "next/server";
import { z } from "zod";
import { created, handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const imageSchema = z.union([
  z.string().min(1).transform((url) => ({ url })),
  z.object({
    url: z.string().min(1),
    fileName: z.string().optional(),
    contentType: z.string().optional(),
  }),
]);

const schema = z.object({
  label: z.string().min(2),
  submittedBy: z.string().min(2),
  senderPhone: z.string().min(6),
  clientId: z.string().optional(),
  images: z.array(imageSchema).default([]),
});

export async function GET() {
  try {
    return ok(await prisma.imageOrder.findMany({ include: { images: true, client: true, convertedOrder: true }, orderBy: { submittedAt: "desc" } }));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const input = schema.parse(await request.json());
    return created(await prisma.imageOrder.create({
      data: {
        label: input.label,
        submittedBy: input.submittedBy,
        senderPhone: input.senderPhone,
        clientId: input.clientId ?? session?.clientId,
        itemCount: input.images.length,
        images: {
          create: input.images.map((image) => ({
            url: image.url,
            fileName: "fileName" in image ? image.fileName : undefined,
            contentType: "contentType" in image ? image.contentType : undefined,
          })),
        },
      },
      include: { images: true },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
