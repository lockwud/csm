import { prisma } from "@/lib/prisma";

type CodeRule = {
  name: string;
  namingType: string;
  prefix: string;
  minLength: number;
  maxLength: number;
  active: boolean;
};

const fallbackRules: Record<string, CodeRule> = {
  "Waybill Number": { name: "Waybill Number", namingType: "Series", prefix: "WB/", minLength: 4, maxLength: 4, active: true },
  "Tracking Code": { name: "Tracking Code", namingType: "Random", prefix: "SNK-", minLength: 8, maxLength: 8, active: true },
  "Dispatch Manifest": { name: "Dispatch Manifest", namingType: "Series", prefix: "MAN/", minLength: 4, maxLength: 4, active: true },
  "Payment Reference": { name: "Payment Reference", namingType: "Series", prefix: "PAY/", minLength: 4, maxLength: 4, active: true },
  "Finance Entry": { name: "Finance Entry", namingType: "Series", prefix: "FIN/", minLength: 4, maxLength: 4, active: true },
  "Support Ticket": { name: "Support Ticket", namingType: "Series", prefix: "SUP/", minLength: 4, maxLength: 4, active: true },
};

function cleanPrefix(prefix: string) {
  return prefix.trim().replaceAll("/", "-").replace(/-+$/g, "");
}

function randomCode(length: number) {
  return crypto.randomUUID().replaceAll("-", "").slice(0, length).toUpperCase();
}

async function getRule(name: string) {
  const fallback = fallbackRules[name] ?? { name, namingType: "Series", prefix: "REF/", minLength: 4, maxLength: 4, active: true };
  try {
    const setting = await prisma.appSetting.findFirst({
      where: { key: "code_settings", scope: "GLOBAL", userId: null, clientId: null, riderId: null },
    });
    const rules = Array.isArray(setting?.value) ? setting.value as Partial<CodeRule>[] : [];
    const rule = rules.find((item) => item.name === name && item.active !== false);
    return {
      ...fallback,
      ...rule,
      minLength: Number(rule?.minLength ?? fallback.minLength),
      maxLength: Number(rule?.maxLength ?? fallback.maxLength),
      active: Boolean(rule?.active ?? fallback.active),
    };
  } catch {
    return fallback;
  }
}

export async function nextReference(name: string) {
  const rule = await getRule(name);
  const prefix = cleanPrefix(rule.prefix || fallbackRules[name]?.prefix || "REF/");

  if (rule.namingType.toLowerCase() === "random") {
    return `${prefix}-${randomCode(rule.maxLength || rule.minLength || 8)}`;
  }

  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const sequence = String(Date.now()).slice(-(rule.maxLength || rule.minLength || 4)).padStart(rule.minLength || 4, "0");
  return `${prefix}-${stamp}-${sequence}`;
}
