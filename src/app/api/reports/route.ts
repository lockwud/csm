import { handleApiError, ok } from "@/lib/api/response";
import { getOperationalReports } from "@/lib/services/reportService";

export async function GET() {
  try {
    return ok(await getOperationalReports());
  } catch (error) {
    return handleApiError(error);
  }
}
