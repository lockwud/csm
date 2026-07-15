import { prisma } from "@/lib/prisma";
import type { JsonValue } from "@/lib/types/json";

export type SettingsCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: SettingsCategoryItem[];
};
export type SettingsCategoryItem = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  value: JsonValue;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
export type SettingsServiceZone = {
  id: string;
  name: string;
  city: string;
  region: string | null;
  active: boolean;
  baseFee: unknown;
};
export type SettingsPricingRule = {
  id: string;
  deliveryType: string;
  baseFee: unknown;
  perKmFee: unknown;
  codFeePercent: unknown;
  active: boolean;
  zone: { name: string } | null;
};
export type SettingsAppSetting = {
  key: string;
  value: JsonValue;
};
export type SettingsData = {
  categories: SettingsCategory[];
  serviceZones: SettingsServiceZone[];
  pricingRules: SettingsPricingRule[];
  appSettings: SettingsAppSetting[];
  databaseUnavailable: boolean;
};

const defaults = {
  "order-types": ["Standard", "Express", "Same Day", "Scheduled", "Bulk"],
  "package-types": ["Documents", "Parcel", "Fragile", "Food", "Electronics"],
  "delivery-zones": [
    "Accra", "Kumasi", "Takoradi", "Tamale", "Cape Coast",
    "Kumasi Tanoso", "Kumasi Asafo", "Kumasi Adum", "Kumasi KNUST", "Kumasi Airport",
    "Kumasi Ejisu", "Kumasi Mampong", "Kumasi Suame", "Kumasi Bantama", "Kumasi Santasi",
    "Kumasi Oforikrom", "Kumasi Danyame", "Kumasi Ahodwo", "Kumasi Kwame Nkrumah Circle",
    "Kumasi Kejetia", "Kumasi Pokuase", "Kumasi Ofankor", "Kumasi Domeabra",
    "Accra Madina", "Accra Legon", "Accra East Legon", "Accra Labone", "Accra Osu",
    "Accra Adenta", "Accra Ashaiman", "Accra Tema", "Accra Tema West", "Accra Spintex",
    "Accra Dansoman", "Accra Achimota", "Accra Kaneshie", "Accra Mallam", "Accra Weija",
    "Accra Kasoa", "Accra Amasaman", "Accra Nungua", "Accra Sakumono",
    "Takoradi Sekondi", "Takoradi Fijai", "Takoradi Effiakuma", "Takoradi New Takoradi",
    "Tamale Central", "Tamale Vittin", "Tamale Sagnarigu", "Tamale Tolon",
    "Cape Coast University", "Cape Coast Pedu", "Cape Coast Abura",
    "Ho", "Koforidua", "Nkawkaw", "Suhum", "Winneba", "Saltpond", "Apam",
    "Wa", "Bolgatanga", "Navrongo", "Bawku", "Yendi", "Salaga", "Bimbilla"
  ],
  "payment-methods": ["Cash", "Mobile Money", "Card", "Bank Transfer", "COD"],
};

let databaseUnavailableUntil = 0;

function fallbackSettings(): SettingsData {
  return {
    categories: Object.entries(defaults).map(([name, labels], categoryIndex) => ({
      id: `fallback-${name}`,
      name,
      description: `${name.replaceAll("-", " ")} configuration`,
      sortOrder: categoryIndex,
      active: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      items: labels.map((label, index) => ({
        id: `fallback-${name}-${index}`,
        categoryId: `fallback-${name}`,
        key: label.toLowerCase().replaceAll(" ", "_"),
        label,
        value: { label },
        active: true,
        sortOrder: index + 1,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      })),
    })),
    serviceZones: [],
    pricingRules: [],
    appSettings: [],
    databaseUnavailable: true,
  };
}

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

export async function getSettings(): Promise<SettingsData> {
  if (Date.now() < databaseUnavailableUntil) return fallbackSettings();

  try {
    await ensureConfigurationDefaults();
    const [categories, serviceZones, pricingRules, appSettings] = await prisma.$transaction([
      prisma.configurationCategory.findMany({ include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }),
      prisma.serviceZone.findMany({ orderBy: { city: "asc" }, include: { pricingRules: true } }),
      prisma.pricingRule.findMany({ include: { zone: true }, orderBy: { createdAt: "desc" } }),
      prisma.appSetting.findMany({ orderBy: { key: "asc" } }),
    ]);
    return {
      categories: categories as unknown as SettingsCategory[],
      serviceZones: serviceZones as unknown as SettingsServiceZone[],
      pricingRules: pricingRules as unknown as SettingsPricingRule[],
      appSettings: appSettings as unknown as SettingsAppSetting[],
      databaseUnavailable: false,
    };
  } catch {
    databaseUnavailableUntil = Date.now() + 60_000;
    console.warn("Settings unavailable. Check DATABASE_URL connectivity.");
    return fallbackSettings();
  }
}

export async function upsertConfigurationItem(categoryName: string, data: { label: string; active?: boolean; value?: JsonValue }) {
  const category = await prisma.configurationCategory.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName },
  });
  const key = data.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return prisma.configurationItem.upsert({
    where: { categoryId_key: { categoryId: category.id, key } },
    update: { label: data.label, active: data.active ?? true, value: data.value as never },
    create: { categoryId: category.id, key, label: data.label, active: data.active ?? true, value: data.value as never },
  });
}
