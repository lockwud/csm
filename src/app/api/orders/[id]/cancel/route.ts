import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { cancelOrder } from "@/lib/services/orderService";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    }
    const input = await request.json().catch(() => ({}));
    const order = await cancelOrder((await params).id, { note: typeof input.note === "string" ? input.note : undefined });
    return ok({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
