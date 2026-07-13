import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, ok } from "@/lib/api/response";
import { assignRider } from "@/lib/services/orderService";

const schema = z.object({ riderId: z.string().min(1) });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return ok(await assignRider((await params).id, schema.parse(await request.json()).riderId));
  } catch (error) {
    return handleApiError(error);
  }
}
