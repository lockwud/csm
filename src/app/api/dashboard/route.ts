import { handleApiError, ok } from "@/lib/api/response";
import { getDashboardMetrics } from "@/lib/services/dashboardService";

export async function GET() {
  try {
    return ok(await getDashboardMetrics());
  } catch (error) {
    return handleApiError(error);
  }
}
