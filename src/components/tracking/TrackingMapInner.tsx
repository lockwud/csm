"use client";

import { useRiderLocation } from "@/providers/useRiderLocation";
import { LeafletLiveRouteMap } from "@/components/maps/LeafletLiveRouteMap";

type TrackingMapInnerProps = {
  riderId: string;
  initialLocation: { latitude: number; longitude: number } | null;
  order: {
    waybill: string;
    status: string;
    rider?: { name?: string | null } | null;
    senderAddress: {
      name?: string | null;
      addressLine1?: string | null;
      city?: string | null;
      latitude?: unknown;
      longitude?: unknown;
    };
    receiverAddress: {
      name?: string | null;
      addressLine1?: string | null;
      city?: string | null;
      latitude?: unknown;
      longitude?: unknown;
    };
    city?: string | null;
  };
};

export function TrackingMapInner({ riderId, initialLocation, order }: TrackingMapInnerProps) {
  const live = useRiderLocation(riderId);
  const riderLocation = live ?? initialLocation;

  return (
    <LeafletLiveRouteMap
      title={`Live Tracking ${order.waybill}`}
      status={order.status}
      riderName={order.rider?.name}
      riderLocation={riderLocation}
      pickup={order.senderAddress}
      destination={order.receiverAddress}
      fallbackCity={order.city}
    />
  );
}
