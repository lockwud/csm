import { dailyCode, trackingCode } from "@/lib/api/ids";

export function generateWaybill() {
  return dailyCode("WB");
}

export { trackingCode };
