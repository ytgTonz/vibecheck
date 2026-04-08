"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast, type ToastItem, type ToastVariant } from "./ToastContext";

const ACCENT_COLORS: Record<ToastVariant, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  return (
    <div
      className={`flex w-80 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg transition-all duration-200 ${
        item.state === "open"
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
    >
      <div className={`w-1 shrink-0 ${ACCENT_COLORS[item.variant]}`} />
      <div className="flex flex-1 items-start justify-between gap-2 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
          {item.description && (
            <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-zinc-500 hover:text-zinc-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastPortal() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
      ))}
    </div>,
    document.body,
  );
}
