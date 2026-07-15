"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Clock3, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deliveryPointsByZone } from "@/lib/deliveryPoints";
import "leaflet/dist/leaflet.css";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RouteAddress = {
  name?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  latitude?: unknown;
  longitude?: unknown;
};

type RoutePoint = Coordinate & {
  label: string;
  caption: string;
  kind: "rider" | "pickup" | "dropoff";
};

const cityCoordinates: Record<string, Coordinate> = {
  Accra: { latitude: 5.6037, longitude: -0.1870 },
  Kumasi: { latitude: 6.6885, longitude: -1.6244 },
  Takoradi: { latitude: 4.9016, longitude: -1.7831 },
  Tamale: { latitude: 9.4034, longitude: -0.8424 },
  Tema: { latitude: 5.6698, longitude: -0.0166 },
  "Cape Coast": { latitude: 5.1053, longitude: -1.2466 },
  "Madina": { latitude: 5.6726, longitude: -0.1659 },
  "Legon": { latitude: 5.6500, longitude: -0.1870 },
  "East Legon": { latitude: 5.6580, longitude: -0.1780 },
  "Labone": { latitude: 5.5610, longitude: -0.1760 },
  "Osu": { latitude: 5.5560, longitude: -0.1790 },
  "Adenta": { latitude: 5.6910, longitude: -0.1630 },
  "Ashaiman": { latitude: 5.7010, longitude: -0.0350 },
  "Tema West": { latitude: 5.6440, longitude: 0.0300 },
  "Tema Community 1": { latitude: 5.6450, longitude: 0.0350 },
  "Spintex": { latitude: 5.6160, longitude: -0.0950 },
  "Dansoman": { latitude: 5.5530, longitude: -0.2660 },
  "Achimota": { latitude: 5.6070, longitude: -0.2330 },
  "Kaneshie": { latitude: 5.5650, longitude: -0.2290 },
  "Mallam": { latitude: 5.5280, longitude: -0.2800 },
  "Weija": { latitude: 5.5820, longitude: -0.3400 },
  "Kasoa": { latitude: 5.5330, longitude: -0.4710 },
  "Amasaman": { latitude: 5.6930, longitude: -0.3360 },
  "Nungua": { latitude: 5.6010, longitude: -0.0820 },
  "Sakumono": { latitude: 5.6110, longitude: 0.0460 },
  "Ada": { latitude: 5.7830, longitude: 0.6160 },
  "Ho": { latitude: 6.6010, longitude: 0.4700 },
  "Koforidua": { latitude: 6.0830, longitude: -0.2500 },
  "Nkawkaw": { latitude: 6.5500, longitude: -0.7830 },
  "Suhum": { latitude: 6.0330, longitude: -0.4500 },
  "Mampong": { latitude: 7.0670, longitude: -1.4000 },
  "Bekwai": { latitude: 6.4500, longitude: -1.5670 },
  "Obuasi": { latitude: 6.2000, longitude: -1.6830 },
  "Konongo": { latitude: 6.6170, longitude: -1.2170 },
  "Agogo": { latitude: 6.8000, longitude: -1.0830 },
  "Nkroful": { latitude: 4.9670, longitude: -2.2500 },
  "Axim": { latitude: 4.8670, longitude: -2.2330 },
  "Elmina": { latitude: 5.0830, longitude: -1.3500 },
  "Winneba": { latitude: 5.3500, longitude: -0.6170 },
  "Saltpond": { latitude: 5.2000, longitude: -1.0670 },
  "Apam": { latitude: 5.2830, longitude: -0.7330 },
  "Dambai": { latitude: 8.0670, longitude: 0.1830 },
  "Buipe": { latitude: 8.2500, longitude: -0.1830 },
  "Bole": { latitude: 9.0330, longitude: -2.2830 },
  "Salaga": { latitude: 8.5500, longitude: -0.5170 },
  "Bimbilla": { latitude: 8.8670, longitude: 0.0500 },
  "Chereponi": { latitude: 10.1330, longitude: 0.3000 },
  "Yendi": { latitude: 9.4330, longitude: 0.0000 },
  "Savelugu": { latitude: 9.6170, longitude: -0.8330 },
  "Karaga": { latitude: 9.9170, longitude: -0.4330 },
  "Bolgatanga": { latitude: 10.7830, longitude: -0.8500 },
  "Navrongo": { latitude: 10.9000, longitude: -1.0830 },
  "Paga": { latitude: 10.9830, longitude: -1.1170 },
  "Wa": { latitude: 10.0670, longitude: -2.5000 },
  "Lawra": { latitude: 10.6330, longitude: -2.8830 },
  "Nandom": { latitude: 10.7500, longitude: -2.9170 },
  "Tumu": { latitude: 10.8830, longitude: -2.0330 },
  "Bawku": { latitude: 11.0670, longitude: -0.2330 },
  "Pusiga": { latitude: 11.0830, longitude: -0.2000 },
};

const deliveryPointCoordinates: Record<string, Coordinate> = Object.fromEntries(
  Object.entries(deliveryPointsByZone).flatMap(([zone, points]) => points.flatMap((point) => [
    [point.label, { latitude: point.latitude, longitude: point.longitude } as Coordinate],
    [`${zone} ${point.label}`, { latitude: point.latitude, longitude: point.longitude } as Coordinate],
  ])),
);

function coordinateFromAddress(address?: RouteAddress | null, fallbackCity?: string | null): Coordinate {
  const latitude = Number(address?.latitude);
  const longitude = Number(address?.longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) return { latitude, longitude };
  return deliveryPointCoordinates[address?.addressLine1 ?? ""] ?? deliveryPointCoordinates[`${address?.city ?? ""} ${address?.addressLine1 ?? ""}`] ?? cityCoordinates[address?.city ?? ""] ?? cityCoordinates[fallbackCity ?? ""] ?? cityCoordinates.Accra;
}

function distanceKm(from: Coordinate, to: Coordinate) {
  const earth = 6371;
  const dLat = (to.latitude - from.latitude) * Math.PI / 180;
  const dLng = (to.longitude - from.longitude) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(from.latitude * Math.PI / 180)
    * Math.cos(to.latitude * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatEta(minutes: number) {
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function subtownsNearby(center: Coordinate, maxKm = 40, limit = 8) {
  const known = Object.entries(cityCoordinates)
    .filter(([name]) => !["Accra", "Kumasi", "Takoradi", "Tamale", "Tema", "Cape Coast"].includes(name))
    .map(([name, coord]) => ({ name, ...coord, distance: distanceKm(center, coord) }))
    .filter((item) => item.distance > 0.5 && item.distance <= maxKm)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
  return known;
}

const riderIcon = new L.DivIcon({
  className: "",
  html: `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-4 ring-brand-light"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6.5h-4l-2 8h4l2-8z"/><path d="M11 14.5h4"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = new L.DivIcon({
  className: "",
  html: `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand shadow-lg ring-4 ring-brand-light"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 12V4h1"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m9 9 2 2 4-4"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const dropoffIcon = new L.DivIcon({
  className: "",
  html: `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shadow-lg ring-4 ring-success-light"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function FitBounds({ points }: { points: Coordinate[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const latLngs = points.map((p) => [p.latitude, p.longitude] as [number, number]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 14, { animate: true });
      return;
    }
    map.fitBounds(latLngs, { padding: [70, 70], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export function LeafletLiveRouteMap({
  title = "Live Route Map",
  status,
  riderLocation,
  pickup,
  destination,
  fallbackCity,
  riderName,
  className = "",
}: {
  title?: string;
  status?: string | null;
  riderLocation?: Coordinate | null;
  pickup?: RouteAddress | null;
  destination?: RouteAddress | null;
  fallbackCity?: string | null;
  riderName?: string | null;
  className?: string;
}) {
  const pickupPoint = coordinateFromAddress(pickup, fallbackCity);
  const destinationPoint = coordinateFromAddress(destination, fallbackCity);
  const hasLiveLocation = Boolean(riderLocation);
  const pickupComplete = ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status ?? "");

  const points: RoutePoint[] = useMemo(() => {
    const routePoints: RoutePoint[] = [];
    if (riderLocation) {
      routePoints.push({ ...riderLocation, label: riderName || "Rider", caption: "Live rider location", kind: "rider" });
    }
    if (!pickupComplete) {
      routePoints.push({
        ...pickupPoint,
        label: "Pickup",
        caption: `${pickup?.addressLine1 ?? "Pickup point"}, ${pickup?.city ?? fallbackCity ?? "Ghana"}`,
        kind: "pickup",
      });
    }
    routePoints.push({
      ...destinationPoint,
      label: "Destination",
      caption: `${destination?.addressLine1 ?? "Delivery point"}, ${destination?.city ?? fallbackCity ?? "Ghana"}`,
      kind: "dropoff",
    });
    return routePoints;
  }, [riderLocation, pickupComplete, pickupPoint, destinationPoint, pickup?.addressLine1, pickup?.city, destination?.addressLine1, destination?.city, fallbackCity, riderName]);

  const routeDistance = useMemo(() => {
    return points.slice(1).reduce((sum, point, index) => sum + distanceKm(points[index], point), 0);
  }, [points]);

  const etaMinutes = useMemo(() => (routeDistance / 30) * 60, [routeDistance]);

  const routePath = useMemo(() => {
    return points.map((point, index) => `${index === 0 ? "" : " "}${point.latitude},${point.longitude}`).join(" ");
  }, [points]);

  void routePath;

  const nearbySubtowns = useMemo(() => subtownsNearby(destinationPoint, 50, 8), [destinationPoint]);

  const mapCenter = useMemo(() => {
    if (points.length === 0) return [destinationPoint.latitude, destinationPoint.longitude] as [number, number];
    const avgLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const avgLng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    return [avgLat, avgLng] as [number, number];
  }, [destinationPoint.latitude, destinationPoint.longitude, points]);

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-white ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><Navigation className="h-4 w-4 text-brand" /> {title}</h2>
          <p className="mt-1 text-sm text-text-muted">Best route: Rider to {pickupComplete ? "destination" : "pickup, then destination"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={hasLiveLocation ? "success" : "secondary"}>{hasLiveLocation ? "Live" : "Awaiting GPS"}</Badge>
          <Badge variant="info">{routeDistance.toFixed(1)} km</Badge>
          <Badge variant="warning"><Clock3 className="mr-1 h-3.5 w-3.5" /> {formatEta(etaMinutes)}</Badge>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative h-[360px] sm:h-[420px]">
          <MapContainer center={mapCenter} zoom={13} className="h-full w-full" zoomControl={true} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            <Polyline
              positions={points.map((p) => [p.latitude, p.longitude] as [number, number])}
              pathOptions={{ color: "#0b57d0", weight: 5, dashArray: "8 6", lineCap: "round", lineJoin: "round" }}
            />
            {points.map((point) => (
              <Marker key={point.kind} position={[point.latitude, point.longitude]} icon={point.kind === "rider" ? riderIcon : point.kind === "pickup" ? pickupIcon : dropoffIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{point.label}</p>
                    <p className="text-text-muted">{point.caption}</p>
                    <p className="mt-1 text-xs text-text-muted">{point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-black uppercase text-brand">Route Summary</p>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Next stop</p>
              <p className="text-text-muted">{pickupComplete ? "Destination" : "Pickup"}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Estimated arrival</p>
              <p className="text-text-muted">{formatEta(etaMinutes)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Distance remaining</p>
              <p className="text-text-muted">{routeDistance.toFixed(1)} km</p>
            </div>
            {points.map((point, index) => (
              <div key={`${point.kind}-detail`} className="rounded-lg bg-white p-3 ring-1 ring-border">
                <p className="font-bold">{index + 1}. {point.label}</p>
                <p className="mt-1 text-text-muted">{point.caption}</p>
              </div>
            ))}
            {nearbySubtowns.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-bold">Nearby subtowns</p>
                <ul className="mt-2 grid gap-1 text-xs text-text-muted">
                  {nearbySubtowns.map((town) => (
                    <li key={town.name} className="flex justify-between">
                      <span>{town.name}</span>
                      <span className="font-semibold">{town.distance.toFixed(1)} km</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
