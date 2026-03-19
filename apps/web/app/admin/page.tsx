"use client";

import { useEffect, useState } from "react";
import {
  setBaseUrl,
  fetchAdminStats,
  useAuthStore,
  AdminStats,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminOverviewPage() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminStats(token)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mx-auto mb-2 h-8 w-16 rounded bg-zinc-800" />
              <div className="mx-auto h-4 w-20 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Users", value: stats.counts.users },
    { label: "Venues", value: stats.counts.venues },
    { label: "Clips", value: stats.counts.clips },
    { label: "Feedback", value: stats.counts.feedback },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center"
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm text-zinc-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Users by role */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Users by Role</h2>
        <div className="flex flex-wrap gap-4">
          {stats.usersByRole.map((r) => (
            <div key={r.role} className="rounded-lg bg-zinc-800 px-4 py-2">
              <span className="text-sm text-zinc-400">{r.role.replace(/_/g, " ")}</span>
              <span className="ml-2 font-bold">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Users</h2>
        <div className="space-y-2">
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2">
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <div className="text-right">
                <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs">{u.role.replace(/_/g, " ")}</span>
                <p className="mt-1 text-xs text-zinc-500">{timeAgo(u.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent venues */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Venues</h2>
        <div className="space-y-2">
          {stats.recentVenues.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2">
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-zinc-500">{v.location}</p>
              </div>
              <p className="text-xs text-zinc-500">{timeAgo(v.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent clips */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Clips</h2>
        <div className="space-y-2">
          {stats.recentClips.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2">
              <div>
                <p className="text-sm font-medium">{c.caption || "Untitled clip"}</p>
                <p className="text-xs text-zinc-500">{c.views} views</p>
              </div>
              <p className="text-xs text-zinc-500">{timeAgo(c.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
