import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const defaults = {
  "order-types": ["Standard", "Express", "Same Day", "Scheduled", "Bulk"],
  "package-types": ["Documents", "Parcel", "Fragile", "Food", "Electronics"],
  "delivery-zones": ["Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast"],
  "payment-methods": ["Cash", "Mobile Money", "Card", "Bank Transfer", "COD"],
};

export async function ensureConfigurationDefaults() {
  for (const [name, labels] of Object.entries(defaults)) {
    const category = await prisma.configurationCategory.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name.replaceAll("-", " ")} configuration` },
    });

    for (const [index, label] of labels.entries()) {
      const key = label.toLowerCase().replaceAll(" ", "_");
      await prisma.configurationItem.upsert({
        where: { categoryId_key: { categoryId: category.id, key } },
        update: {},
        create: {
          categoryId: category.id,
          key,
          label,
          sortOrder: index + 1,
          value: { label },
        },
      });
    }
  }
}

export async function getSettings() {
  await ensureConfigurationDefaults();
  const [categories, serviceZones, pricingRules, appSettings] = await prisma.$transaction([
    prisma.configurationCategory.findMany({ include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }),
    prisma.serviceZone.findMany({ orderBy: { city: "asc" }, include: { pricingRules: true } }),
    prisma.pricingRule.findMany({ include: { zone: true }, orderBy: { createdAt: "desc" } }),
    prisma.appSetting.findMany({ orderBy: { key: "asc" } }),
  ]);
  return { categories, serviceZones, pricingRules, appSettings };
}

export async function upsertConfigurationItem(categoryName: string, data: { label: string; active?: boolean; value?: Prisma.InputJsonValue }) {
  const category = await prisma.configurationCategory.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
  const key = data.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return prisma.configurationItem.upsert({
    where: { categoryId_key: { categoryId: category.id, key } },
    update: { label: data.label, active: data.active ?? true, value: data.value },
    create: { categoryId: category.id, key, label: data.label, active: data.active ?? true, value: data.value },
  });
}
