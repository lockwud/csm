"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, Camera, LocateFixed, MapPin, Navigation, PackageCheck, QrCode, Route, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect: (image: HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

type RiderOrder = {
  id: string;
  waybill: string;
  status: string;
  city: string;
  receiverAddress: { name: string; addressLine1: string; city: string; latitude?: string | number | null; longitude?: string | number | null };
  senderAddress: { city: string };
  client?: { businessName: string } | null;
};

type RiderData = {
  rider: { name: string; zone: string; status: string } | null;
  stats: { assignedOrders: number; activeOrders: number; deliveredOrders: number; manifests: number };
  orders: RiderOrder[];
};

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Accra: { lat: 5.6037, lng: -0.187 },
  Kumasi: { lat: 6.6885, lng: -1.6244 },
  Takoradi: { lat: 4.9016, lng: -1.7831 },
  Tamale: { lat: 9.4034, lng: -0.8424 },
  Tema: { lat: 5.6698, lng: -0.0166 },
};

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earth = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function orderPoint(order: RiderOrder) {
  const lat = Number(order.receiverAddress.latitude);
  const lng = Number(order.receiverAddress.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return cityCoordinates[order.receiverAddress.city] ?? cityCoordinates[order.city] ?? cityCoordinates.Accra;
}

export function RiderDashboardClient() {
  const [data, setData] = useState<RiderData | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetch("/api/rider/dashboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => result.ok && setData(result.data))
      .catch(() => setMessage("Connection is unavailable."));
  }, []);

  const routeOrders = useMemo(() => {
    const origin = location ?? cityCoordinates.Accra;
    return [...(data?.orders ?? [])]
      .filter((order) => !["DELIVERED", "FAILED", "CANCELLED"].includes(order.status))
      .map((order) => ({ order, km: distanceKm(origin, orderPoint(order)) }))
      .sort((a, b) => a.km - b.km);
  }, [data?.orders, location]);

  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;
    let frame = 0;

    async function startScanner() {
      if (!window.BarcodeDetector) {
        setScanMessage("Camera QR scanning is not supported in this browser. Enter the code manually.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          const results = await detector.detect(videoRef.current).catch(() => []);
          const code = results[0]?.rawValue;
          if (code) {
            setConfirmation(code);
            setScannerOpen(false);
            setScanMessage(null);
            setMessage("QR code scanned.");
            return;
          }
          frame = requestAnimationFrame(scan);
        };
        frame = requestAnimationFrame(scan);
      } catch {
        setScanMessage("Camera access was blocked. Enter the code manually.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [scannerOpen]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setLocation(next);
      await fetch("/api/rider/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: next.lat, longitude: next.lng, note: "Rider portal update" }),
      });
      setMessage("Live location updated.");
    }, () => setMessage("Unable to read current location."));
  }

  async function confirmDelivery(order: RiderOrder) {
    if (!confirmation.trim()) {
      setMessage("Enter or scan the receiver confirmation code.");
      return;
    }
    const response = await fetch(`/api/orders/${order.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "DELIVERED",
        location: order.receiverAddress.city,
        note: `Receiver confirmation ${confirmation}`,
        confirmationCode: confirmation,
      }),
    });
    if (!response.ok) {
      setMessage("Unable to confirm delivery.");
      return;
    }
    setMessage("Delivery confirmed.");
    setConfirmation("");
    setData((current) => current
      ? { ...current, orders: current.orders.map((item) => item.id === order.id ? { ...item, status: "DELIVERED" } : item) }
      : current);
  }

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div>
        <h1 className="text-2xl font-black text-text">Rider Route</h1>
        <p className="mt-1 text-sm text-text-muted">Manage assigned stops, location updates, and delivery confirmation.</p>
      </div>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-text-muted">Logged in rider</p>
              <h2 className="text-xl font-bold">{data?.rider?.name ?? "Rider"}</h2>
              <p className="text-sm text-text-muted">{data?.rider?.zone ?? "Assigned zone"} · {data?.rider?.status ?? "Offline"}</p>
            </div>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand"><Bike className="h-6 w-6" /></span>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-text-muted">Assigned</p><strong>{data?.stats.assignedOrders ?? 0}</strong></div>
          <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-text-muted">Active</p><strong>{data?.stats.activeOrders ?? 0}</strong></div>
          <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-text-muted">Done</p><strong>{data?.stats.deliveredOrders ?? 0}</strong></div>
          <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-text-muted">Runs</p><strong>{data?.stats.manifests ?? 0}</strong></div>
        </section>

        <section className="rounded-2xl border border-brand/20 bg-brand-light p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-white text-brand"><LocateFixed className="h-7 w-7" /></span>
              <div>
                <h2 className="text-lg font-bold text-brand">Use Current Location</h2>
                <p className="text-sm text-text-muted">{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Enable live rider tracking"}</p>
              </div>
            </div>
            <Button type="button" onClick={useCurrentLocation}>Use</Button>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#e2e8f0_1px,transparent_1px),linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
          <div className="relative z-10 grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-brand" /> Live Map</h2>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand shadow-sm">Best route</span>
            </div>
            <div className="grid min-h-56 place-items-center rounded-xl bg-white/70 text-center">
              <div>
                <Navigation className="mx-auto mb-3 h-10 w-10 text-brand" />
                <p className="font-bold">Route optimized by nearest destination</p>
                <p className="text-sm text-text-muted">Stops are sorted from your live location to the nearest destination first.</p>
              </div>
            </div>
          </div>
        </section>

        {message ? <p className="font-bold text-brand">{message}</p> : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><QrCode className="h-5 w-5 text-brand" /> Scan or Enter Confirmation</h2>
          <div className="grid gap-3">
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="QR / receiver code" className="h-12 rounded-xl bg-slate-100 px-4 text-sm outline-none focus:ring-2 focus:ring-brand/20" />
            <Button type="button" variant="secondary" leftIcon={<Camera className="h-4 w-4" />} onClick={() => setScannerOpen(true)}>
              Scan QR with Camera
            </Button>
            <p className="text-xs text-text-muted">Use this when handing the package to the receiver. The order status will update through the backend.</p>
          </div>
        </section>

        <section className="grid gap-3 pb-12">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Route className="h-5 w-5" /> Best Route Stops</h2>
          {routeOrders.map(({ order, km }, index) => (
            <article key={order.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <strong>{index + 1}. {order.waybill}</strong>
                  <p className="text-sm text-text-muted">{order.receiverAddress.name} · {order.receiverAddress.city}</p>
                </div>
                <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">{km.toFixed(1)} km</span>
              </div>
              <p className="mt-3 text-sm">{order.receiverAddress.addressLine1}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-text-muted"><PackageCheck className="h-4 w-4" /> {order.status.replaceAll("_", " ")}</div>
                <Button type="button" size="sm" onClick={() => confirmDelivery(order)}>Confirm</Button>
              </div>
            </article>
          ))}
        </section>
      {scannerOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <strong>Scan receiver QR</strong>
              <button type="button" aria-label="Close scanner" className="rounded-full p-2 text-text-muted hover:bg-slate-100" onClick={() => setScannerOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 p-4">
              <video ref={videoRef} className="aspect-square w-full rounded-xl bg-slate-900 object-cover" muted playsInline />
              {scanMessage ? <p className="text-sm font-semibold text-danger">{scanMessage}</p> : <p className="text-sm text-text-muted">Point the camera at the receiver confirmation QR code.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
