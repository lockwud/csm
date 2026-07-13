import { NextRequest } from "next/server";
import { fail, handleApiError, ok } from "@/lib/api/response";
import { getOperationalReports } from "@/lib/services/reportService";

const sections = ["operations", "finance", "riders", "clients", "support"] as const;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!sections.includes(id as never)) return fail(404, "Report not found");

    const reports = await getOperationalReports();
    if (id === "riders") return ok({ id, dispatch: reports.dispatch });
    return ok({ id, report: reports[id as Exclude<typeof sections[number], "riders">] });
  } catch (error) {
    return handleApiError(error);
  }
}
