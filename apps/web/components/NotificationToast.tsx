"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket, useAuthStore, getSocket, NotificationEvent } from "@vibecheck/shared";

interface Toast {
  id: number;
  title: string;
  body: string;
  data?: Record<string, string>;
}

let nextId = 0;

export default function NotificationToast() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Ensure socket connects with auth token for targeted notifications
  useEffect(() => {
    if (token) {
      getSocket(token);
    }
  }, [token]);

  const handleNotification = useCallback((event: NotificationEvent) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, title: event.title, body: event.body, data: event.data }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useSocket({ notification: handleNotification });

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClick = (toast: Toast) => {
    dismiss(toast.id);
    if (toast.data?.venueId) {
      router.push(`/venues/${toast.data.venueId}`);
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className="animate-in slide-in-from-right w-80 cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg transition-opacity hover:border-zinc-700"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">{toast.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{toast.body}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              className="shrink-0 text-zinc-500 hover:text-zinc-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
