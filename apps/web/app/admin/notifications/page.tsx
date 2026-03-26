"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  fetchNotifications,
  markNotificationRead,
  useAuthStore,
  AppNotification,
  NotificationType,
} from "@vibecheck/shared";

const PAGE_SIZE = 20;

const typeConfig: Record<NotificationType, { label: string; color: string; icon: string }> = {
  STREAM_LIVE: { label: "Stream Live", color: "bg-green-900/50 text-green-400", icon: "📡" },
  STREAM_ENDED: { label: "Stream Ended", color: "bg-zinc-700 text-zinc-300", icon: "⏹" },
  VENUE_CREATED: { label: "Venue Created", color: "bg-blue-900/50 text-blue-400", icon: "🏠" },
  USER_REGISTERED: { label: "User Registered", color: "bg-purple-900/50 text-purple-400", icon: "👤" },
};

const filters = ["ALL", "UNREAD"] as const;

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchNotifications(token, {
      unreadOnly: filter === "UNREAD",
      page,
    })
      .then((res) => {
        setNotifications(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleClick = async (n: AppNotification) => {
    if (!n.read && token) {
      try {
        await markNotificationRead(n.id, token);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
        );
      } catch {
        // silent — still navigate
      }
    }

    const data = n.data as Record<string, string> | null;
    if (data?.venueId) {
      router.push(`/admin/venues`);
    } else if (data?.userId) {
      router.push(`/admin/users`);
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.allSettled(unread.map((n) => markNotificationRead(n.id, token)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {f === "ALL" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            {total} notification{total !== 1 ? "s" : ""}
          </span>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 h-4 w-48 rounded bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">
            {filter === "UNREAD" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = typeConfig[n.type];
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`cursor-pointer rounded-xl border p-4 transition-colors hover:border-zinc-600 ${
                    n.read
                      ? "border-zinc-800 bg-zinc-900/50"
                      : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-base">{config.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        <span className="text-xs text-zinc-500">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">{n.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
