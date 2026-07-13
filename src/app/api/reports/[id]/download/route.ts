import { NextRequest } from "next/server";
import { getOperationalReportCsv } from "@/lib/services/reportService";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const csv = await getOperationalReportCsv(id);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sankofa-${id}-report.csv"`,
    },
  });
}
