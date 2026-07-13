"use client";

import { QueryProvider } from "./QueryProvider";
import { SocketProvider } from "./SocketProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        <ToastProvider>{children}</ToastProvider>
      </SocketProvider>
    </QueryProvider>
  );
}
