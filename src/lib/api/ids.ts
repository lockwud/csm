const counters = new Map<string, number>();

export function dailyCode(prefix: string) {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const key = `${prefix}-${stamp}`;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);
  return `${prefix}-${stamp}-${String(next).padStart(4, "0")}`;
}

export function trackingCode() {
  return `SNK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function createWaybill() {
  return dailyCode("WB");
}
