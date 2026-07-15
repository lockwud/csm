"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type SessionInfo = {
  sub: string;
  email: string;
  name: string;
  role: string;
  clientId?: string | null;
  riderId?: string | null;
};

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
  session: SessionInfo | null;
  subscribeToRider: (riderId: string) => void;
  unsubscribeFromRider: (riderId: string) => void;
  sendLocation: (latitude: number, longitude: number, note?: string) => void;
};

export const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const response = await fetch("/api/socket-token", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (!result.ok || !result.token) return;
        if (cancelled) return;

        setSession(result.session);
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || window.location.origin, {
          path: "/socket.io",
          transports: ["websocket", "polling"],
          auth: { token: result.token },
        });
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on("connect", () => setConnected(true));
        newSocket.on("disconnect", () => setConnected(false));
      } catch {
        // silently ignore socket init failures
      }
    }

    init();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  const subscribeToRider = (riderId: string) => {
    socket?.emit("rider:subscribe", { riderId });
  };

  const unsubscribeFromRider = (riderId: string) => {
    socket?.emit("rider:unsubscribe", { riderId });
  };

  const sendLocation = (latitude: number, longitude: number, note?: string) => {
    socket?.emit("rider:location", { latitude, longitude, note });
  };

  return (
    <SocketContext.Provider
      value={{ socket, connected, session, subscribeToRider, unsubscribeFromRider, sendLocation }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
}
