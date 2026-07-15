import { Bike, Clock3, MapPin, Navigation, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deliveryPointsByZone } from "@/lib/deliveryPoints";

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

function pointPosition(point: Coordinate, points: Coordinate[]) {
  const latitudes = points.map((item: Coordinate) => item.latitude);
  const longitudes = points.map((item: Coordinate) => item.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(0.001, maxLat - minLat);
  const lngRange = Math.max(0.001, maxLng - minLng);
  const x = 12 + ((point.longitude - minLng) / lngRange) * 76;
  const y = 12 + ((maxLat - point.latitude) / latRange) * 76;
  return { x, y };
}

function pinClasses(kind: RoutePoint["kind"]) {
  if (kind === "rider") return "bg-brand text-white ring-brand-light";
  if (kind === "pickup") return "bg-white text-brand ring-brand-light";
  return "bg-success text-white ring-success-light";
}

function PinIcon({ kind }: { kind: RoutePoint["kind"] }) {
  if (kind === "rider") return <Bike className="h-5 w-5" />;
  if (kind === "pickup") return <PackageCheck className="h-5 w-5" />;
  return <MapPin className="h-5 w-5" />;
}

export function LiveRouteMap({
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
  const points: RoutePoint[] = [
    ...(riderLocation ? [{ ...riderLocation, label: riderName || "Rider", caption: "Live rider location", kind: "rider" as const }] : []),
    ...(pickupComplete ? [] : [{ ...pickupPoint, label: "Pickup", caption: `${pickup?.addressLine1 ?? "Pickup point"}, ${pickup?.city ?? fallbackCity ?? "Ghana"}`, kind: "pickup" as const }]),
    { ...destinationPoint, label: "Destination", caption: `${destination?.addressLine1 ?? "Delivery point"}, ${destination?.city ?? fallbackCity ?? "Ghana"}`, kind: "dropoff" },
  ];
  const positions = points.map((point: RoutePoint) => ({ point, ...pointPosition(point, points) }));
  const routeDistance = points.slice(1).reduce((sum: number, point: RoutePoint, index: number) => sum + distanceKm(points[index], point), 0);
  const etaMinutes = routeDistance / 30 * 60;
  const nextStop = pickupComplete ? "Destination" : "Pickup";
  const routePath = positions.map((point: { point: RoutePoint; x: number; y: number }, index: number) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

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
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[320px] overflow-hidden bg-slate-100 sm:min-h-[380px]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#cbd5e1_1px,transparent_1px),linear-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={routePath} fill="none" stroke="#0b57d0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          </svg>
          {positions.map(({ point, x, y }: { point: RoutePoint; x: number; y: number }) => (
            <div
              key={point.kind}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-full shadow-lg ring-4 ${pinClasses(point.kind)}`}>
                <PinIcon kind={point.kind} />
              </span>
              <span className="mt-2 block max-w-[140px] rounded-md bg-white/95 px-2 py-1 text-center text-[11px] font-bold shadow-sm">
                {point.label}
              </span>
            </div>
          ))}
        </div>
        <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-black uppercase text-brand">Route Summary</p>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Next stop</p>
              <p className="text-text-muted">{nextStop}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Estimated arrival</p>
              <p className="text-text-muted">{formatEta(etaMinutes)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-bold">Distance remaining</p>
              <p className="text-text-muted">{routeDistance.toFixed(1)} km</p>
            </div>
            {points.map((point: RoutePoint, index: number) => (
              <div key={`${point.kind}-detail`} className="rounded-lg bg-white p-3 ring-1 ring-border">
                <p className="font-bold">{index + 1}. {point.label}</p>
                <p className="mt-1 text-text-muted">{point.caption}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
