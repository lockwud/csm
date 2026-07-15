export type DeliveryPoint = {
  label: string;
  latitude: number;
  longitude: number;
};

export const deliveryPointsByZone: Record<string, DeliveryPoint[]> = {
  Accra: [
    { label: "Madina", latitude: 5.6726, longitude: -0.1659 },
    { label: "Legon", latitude: 5.65, longitude: -0.187 },
    { label: "East Legon", latitude: 5.658, longitude: -0.178 },
    { label: "Labone", latitude: 5.561, longitude: -0.176 },
    { label: "Osu", latitude: 5.556, longitude: -0.179 },
    { label: "Adenta", latitude: 5.691, longitude: -0.163 },
    { label: "Spintex", latitude: 5.616, longitude: -0.095 },
    { label: "Dansoman", latitude: 5.553, longitude: -0.266 },
    { label: "Achimota", latitude: 5.607, longitude: -0.233 },
    { label: "Kaneshie", latitude: 5.565, longitude: -0.229 },
    { label: "Mallam", latitude: 5.528, longitude: -0.28 },
    { label: "Weija", latitude: 5.582, longitude: -0.34 },
    { label: "Amasaman", latitude: 5.693, longitude: -0.336 },
    { label: "Nungua", latitude: 5.601, longitude: -0.082 },
    { label: "Sakumono", latitude: 5.611, longitude: 0.046 },
  ],
  Tema: [
    { label: "Community 1", latitude: 5.645, longitude: 0.035 },
    { label: "Community 2", latitude: 5.6504, longitude: 0.0125 },
    { label: "Community 7", latitude: 5.6699, longitude: 0.0166 },
    { label: "Community 25", latitude: 5.7505, longitude: 0.0306 },
    { label: "Sakumono", latitude: 5.611, longitude: 0.046 },
  ],
  Kumasi: [
    { label: "Tanoso", latitude: 6.7089, longitude: -1.6814 },
    { label: "Asafo", latitude: 6.6855, longitude: -1.6209 },
    { label: "Adum", latitude: 6.6921, longitude: -1.6232 },
    { label: "KNUST", latitude: 6.6745, longitude: -1.5716 },
    { label: "Airport", latitude: 6.7146, longitude: -1.5913 },
    { label: "Ejisu", latitude: 6.7155, longitude: -1.4566 },
    { label: "Suame", latitude: 6.7294, longitude: -1.6318 },
    { label: "Bantama", latitude: 6.7042, longitude: -1.6358 },
    { label: "Santasi", latitude: 6.6514, longitude: -1.6547 },
    { label: "Oforikrom", latitude: 6.6951, longitude: -1.5853 },
    { label: "Danyame", latitude: 6.6907, longitude: -1.6421 },
    { label: "Ahodwo", latitude: 6.6604, longitude: -1.6263 },
    { label: "Kejetia", latitude: 6.6928, longitude: -1.6221 },
  ],
  Takoradi: [
    { label: "Sekondi", latitude: 4.934, longitude: -1.7137 },
    { label: "Fijai", latitude: 4.9349, longitude: -1.7659 },
    { label: "Effiakuma", latitude: 4.9076, longitude: -1.7645 },
    { label: "New Takoradi", latitude: 4.8992, longitude: -1.7437 },
    { label: "Anaji", latitude: 4.9342, longitude: -1.7992 },
  ],
  Tamale: [
    { label: "Central", latitude: 9.4034, longitude: -0.8424 },
    { label: "Vittin", latitude: 9.4332, longitude: -0.8218 },
    { label: "Sagnarigu", latitude: 9.4427, longitude: -0.8313 },
    { label: "Tolon", latitude: 9.4063, longitude: -1.0644 },
    { label: "Kalpohin", latitude: 9.416, longitude: -0.844 },
  ],
  "Cape Coast": [
    { label: "University", latitude: 5.1167, longitude: -1.2907 },
    { label: "Pedu", latitude: 5.1277, longitude: -1.262 },
    { label: "Abura", latitude: 5.1184, longitude: -1.2479 },
    { label: "Siwdu", latitude: 5.1091, longitude: -1.2543 },
    { label: "Elmina", latitude: 5.083, longitude: -1.35 },
  ],
  Ho: [
    { label: "Ho Central", latitude: 6.601, longitude: 0.47 },
    { label: "Ho Dome", latitude: 6.6108, longitude: 0.4723 },
    { label: "Bankoe", latitude: 6.6032, longitude: 0.4678 },
    { label: "Ahoe", latitude: 6.5987, longitude: 0.4824 },
  ],
  Koforidua: [
    { label: "Central", latitude: 6.083, longitude: -0.25 },
    { label: "Effiduase", latitude: 6.1022, longitude: -0.2479 },
    { label: "Srodae", latitude: 6.0904, longitude: -0.2586 },
    { label: "Betom", latitude: 6.0745, longitude: -0.2514 },
  ],
  Nkawkaw: [
    { label: "Central", latitude: 6.55, longitude: -0.783 },
    { label: "Amanfrom", latitude: 6.5435, longitude: -0.7749 },
    { label: "Nsuta", latitude: 6.563, longitude: -0.776 },
  ],
  Suhum: [
    { label: "Central", latitude: 6.033, longitude: -0.45 },
    { label: "Nankese", latitude: 6.091, longitude: -0.426 },
    { label: "Akorabo", latitude: 6.009, longitude: -0.425 },
  ],
  Winneba: [
    { label: "Central", latitude: 5.35, longitude: -0.617 },
    { label: "Low Cost", latitude: 5.356, longitude: -0.626 },
    { label: "University", latitude: 5.3529, longitude: -0.6258 },
  ],
  Saltpond: [
    { label: "Central", latitude: 5.2, longitude: -1.067 },
    { label: "Ankaful", latitude: 5.2109, longitude: -1.0723 },
  ],
  Apam: [
    { label: "Central", latitude: 5.283, longitude: -0.733 },
    { label: "Mumford", latitude: 5.2605, longitude: -0.7581 },
  ],
  Wa: [
    { label: "Central", latitude: 10.067, longitude: -2.5 },
    { label: "Kpaguri", latitude: 10.0719, longitude: -2.5121 },
    { label: "Dobile", latitude: 10.056, longitude: -2.492 },
  ],
  Bolgatanga: [
    { label: "Central", latitude: 10.783, longitude: -0.85 },
    { label: "Zuarungu", latitude: 10.7926, longitude: -0.7647 },
    { label: "Tindonsobligo", latitude: 10.779, longitude: -0.862 },
  ],
  Navrongo: [
    { label: "Central", latitude: 10.9, longitude: -1.083 },
    { label: "Paga", latitude: 10.983, longitude: -1.117 },
    { label: "Kandiga", latitude: 10.933, longitude: -1.019 },
  ],
  Bawku: [
    { label: "Central", latitude: 11.067, longitude: -0.233 },
    { label: "Pusiga", latitude: 11.083, longitude: -0.2 },
    { label: "Zebilla", latitude: 10.998, longitude: -0.508 },
  ],
  Yendi: [
    { label: "Central", latitude: 9.433, longitude: 0 },
    { label: "Gbungbaliga", latitude: 9.473, longitude: -0.028 },
  ],
  Salaga: [
    { label: "Central", latitude: 8.55, longitude: -0.517 },
    { label: "Kpembe", latitude: 8.564, longitude: -0.502 },
  ],
  Bimbilla: [
    { label: "Central", latitude: 8.867, longitude: 0.05 },
    { label: "Lungni", latitude: 8.894, longitude: 0.035 },
  ],
};

export function baseDeliveryZones(labels: string[]) {
  const known = Object.keys(deliveryPointsByZone);
  const bases = labels.map((label) => known.find((zone) => label === zone || label.startsWith(`${zone} `)) ?? label);
  return Array.from(new Set(bases)).sort();
}

export function pointForZone(zone: string, point: string) {
  return deliveryPointsByZone[zone]?.find((item) => item.label === point) ?? null;
}
