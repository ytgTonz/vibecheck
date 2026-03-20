"use client";

import Link from "next/link";
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
    { label: "Users", value: stats.counts.users, href: "/admin/users", description: "Review accounts and roles" },
    { label: "Venues", value: stats.counts.venues, href: "/admin/venues", description: "Inspect venue ownership" },
    { label: "Clips", value: stats.counts.clips, href: "/admin/clips", description: "Moderate recent uploads" },
    { label: "Feedback", value: stats.counts.feedback, href: "/admin/feedback", description: "Triage platform issues" },
  ];

  const quickActions = [
    { title: "Review Feedback", href: "/admin/feedback", description: "Search bug reports, suggestions, and recent ratings." },
    { title: "Manage Users", href: "/admin/users", description: "Find owners, promoters, and account activity quickly." },
    { title: "Moderate Clips", href: "/admin/clips", description: "Inspect recent uploads, thumbnails, and delete risky content." },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
          >
            <p className="text-sm font-semibold text-white">{action.title}</p>
            <p className="mt-2 text-sm text-zinc-400">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm text-zinc-300">{card.label}</p>
            <p className="mt-2 text-xs text-zinc-500">{card.description}</p>
          </Link>
        ))}
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-zinc-400 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {stats.recentUsers.map((u) => (
              <Link key={u.id} href="/admin/users" className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2 transition-colors hover:bg-zinc-800">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs">{u.role.replace(/_/g, " ")}</span>
                  <p className="mt-1 text-xs text-zinc-500">{timeAgo(u.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Venues</h2>
            <Link href="/admin/venues" className="text-xs text-zinc-400 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {stats.recentVenues.map((v) => (
              <div key={v.id} className="rounded-lg bg-zinc-800/50 px-4 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/venues/${v.id}`} className="text-sm font-medium hover:text-zinc-300 hover:underline">
                      {v.name}
                    </Link>
                    <p className="text-xs text-zinc-500">{v.location}</p>
                  </div>
                  <p className="text-xs text-zinc-500">{timeAgo(v.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Clips</h2>
            <Link href="/admin/clips" className="text-xs text-zinc-400 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {stats.recentClips.map((clip) => (
              <Link key={clip.id} href="/admin/clips" className="block rounded-lg bg-zinc-800/50 px-4 py-2 transition-colors hover:bg-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{clip.caption || "Untitled clip"}</p>
                    <p className="text-xs text-zinc-500">
                      <span>{clip.views} views</span>
                      {clip.venue ? <span> &middot; {clip.venue.name}</span> : null}
                    </p>
                    {clip.uploader ? (
                      <p className="text-xs text-zinc-600">{clip.uploader.name} &middot; {clip.uploader.email}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-zinc-500">{timeAgo(clip.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
