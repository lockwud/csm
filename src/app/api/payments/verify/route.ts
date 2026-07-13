import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleApiError, ok } from "@/lib/api/response";
import { verifyAndApplyPayment } from "@/lib/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference") ?? "";
    const result = await verifyAndApplyPayment(reference);
    const returnUrl = request.nextUrl.searchParams.get("returnUrl");
    if (returnUrl) {
      const redirectUrl = new URL(returnUrl, request.nextUrl.origin);
      if (redirectUrl.origin !== request.nextUrl.origin) {
        redirectUrl.protocol = request.nextUrl.protocol;
        redirectUrl.host = request.nextUrl.host;
        redirectUrl.pathname = "/client/payments";
        redirectUrl.search = "";
      }
      redirectUrl.searchParams.set("paymentReference", reference);
      redirectUrl.searchParams.set("payment", result?.status ?? "VERIFIED");
      return NextResponse.redirect(redirectUrl);
    }
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
