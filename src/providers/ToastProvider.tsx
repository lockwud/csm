"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Toast } from "@/components/ui/Toast";

type ToastVariant = "success" | "error" | "warning" | "info";
type ToastItem = {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 4));
    window.setTimeout(() => {
      setToasts((current: ToastItem[]) => current.filter((item: ToastItem) => item.id !== id));
    }, 4500);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    success: (title, message) => showToast({ title, message, variant: "success" }),
    error: (title, message) => showToast({ title, message, variant: "error" }),
    info: (title, message) => showToast({ title, message, variant: "info" }),
    warning: (title, message) => showToast({ title, message, variant: "warning" }),
  }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] grid w-[min(380px,calc(100vw-2rem))] gap-3">
        {toasts.map((toast: ToastItem) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast title={toast.title} message={toast.message} variant={toast.variant} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
