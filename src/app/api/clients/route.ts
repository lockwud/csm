import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api/response";
import { clientSchema } from "@/lib/api/validators/cms";
import { prisma } from "@/lib/prisma";

type ClientWithOrderCount = Prisma.ClientGetPayload<{ include: { _count: { select: { orders: true } } } }>;

function serializeClient(client: ClientWithOrderCount) {
  return {
    id: client.id,
    businessName: client.businessName,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    tier: client.tier,
    outstandingBalance: Number(client.outstandingBalance),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    _count: client._count,
  };
}

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { businessName: "asc" }, include: { _count: { select: { orders: true } } } });
    return ok(clients.map((client: ClientWithOrderCount) => serializeClient(client)));
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
