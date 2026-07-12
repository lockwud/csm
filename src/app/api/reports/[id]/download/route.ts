import { NextRequest } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return new Response(`report_id,status\n${id},queued\n`, { headers: { "content-type": "text/csv" } });
}
