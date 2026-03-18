"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  setBaseUrl,
  fetchMyVenues,
  useAuthStore,
  VenueWithStats,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

/** Format seconds as m:ss. */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format an ISO date string as a relative "time ago" label. */
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    if (user.role !== "VENUE_OWNER" && user.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    setLoading(true);
    fetchMyVenues(token)
      .then(setVenues)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      )
      .finally(() => setLoading(false));
  }, [hydrated, user, token, router]);

  if (!hydrated || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-zinc-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Venue Dashboard</h1>
        <p className="text-zinc-400">
          You haven&apos;t claimed any venues yet. Visit a{" "}
          <Link href="/" className="text-white underline hover:text-zinc-300">
            venue page
          </Link>{" "}
          and click &quot;Claim this venue&quot; to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Venue Dashboard</h1>

      {venues.map((venue) => (
        <div
          key={venue.id}
          className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
        >
          {/* Venue header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{venue.name}</h2>
              <p className="text-sm text-zinc-400">{venue.location}</p>
            </div>
            <Link
              href={`/venues/${venue.id}`}
              className="shrink-0 text-sm text-zinc-400 hover:text-white"
            >
              View page &rarr;
            </Link>
          </div>

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">{venue.stats.totalViews}</p>
              <p className="text-xs text-zinc-400">Total Views</p>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">{venue.stats.totalClips}</p>
              <p className="text-xs text-zinc-400">Total Clips</p>
            </div>
            <div className="rounded-lg bg-zinc-800 p-4 text-center">
              <p className="text-2xl font-bold">{venue.stats.clipsThisWeek}</p>
              <p className="text-xs text-zinc-400">Clips This Week</p>
            </div>
          </div>

          {/* Recent clips */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-300">
              Recent Clips
            </h3>
            {venue.recentClips.length === 0 ? (
              <p className="text-sm text-zinc-500">No clips uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {venue.recentClips.map((clip) => (
                  <div
                    key={clip.id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-zinc-700">
                      {clip.thumbnail ? (
                        <Image
                          src={clip.thumbnail}
                          alt={clip.caption || "Clip"}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                          No thumb
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {clip.caption || "Untitled clip"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDuration(clip.duration)} &middot;{" "}
                        {timeAgo(clip.createdAt)}
                      </p>
                    </div>

                    {/* Views */}
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      {clip.views}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
