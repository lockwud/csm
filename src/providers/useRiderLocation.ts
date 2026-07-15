"use client";

import { useContext, useEffect, useState } from "react";
import { SocketContext } from "@/providers/SocketProvider";

export function useRiderLocation(riderId: string | undefined) {
  const ctx = useContext(SocketContext);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; updatedAt?: string } | null>(null);

  useEffect(() => {
    if (!riderId || !ctx?.socket) return;

    ctx.subscribeToRider(riderId);

    const handler = (payload: { riderId: string; latitude: number; longitude: number; updatedAt: string }) => {
      if (payload.riderId === riderId) {
        setLocation({ latitude: payload.latitude, longitude: payload.longitude, updatedAt: payload.updatedAt });
      }
    };

    const socket = ctx.socket;
    socket.on("location:update", handler);

    return () => {
      ctx.unsubscribeFromRider(riderId);
      socket.off("location:update", handler);
    };
  }, [riderId, ctx]);

  return location;
}
