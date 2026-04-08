"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** "open" → visible, "closing" → exit animation in progress */
  state: "open" | "closing";
}

interface ToastOptions {
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4_000;
const EXIT_ANIMATION_MS = 200;
const MAX_VISIBLE = 3;

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      fn();
    }, ms);
    timersRef.current.add(timer);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, state: "closing" as const } : t)));
    scheduleTimeout(() => remove(id), EXIT_ANIMATION_MS);
  }, [remove, scheduleTimeout]);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { ...opts, id, state: "open" as const }]);
      scheduleTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss, scheduleTimeout],
  );

  // Enforce max visible: dismiss overflow whenever toasts change
  useEffect(() => {
    const open = toasts.filter((t) => t.state === "open");
    if (open.length <= MAX_VISIBLE) return;
    const overflow = open.slice(0, open.length - MAX_VISIBLE);
    overflow.forEach((t) => dismiss(t.id));
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
