"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  setBaseUrl,
  fetchMyVenues,
  generateInvite,
  fetchVenuePromoters,
  removePromoter,
  useAuthStore,
  VenueWithStats,
  VenuePromoter,
  Invite,
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

  // Promoter management state (keyed by venueId)
  const [promoters, setPromoters] = useState<Record<string, VenuePromoter[]>>({});
  const [invites, setInvites] = useState<Record<string, Invite>>({});
  const [loadingPromoters, setLoadingPromoters] = useState<Record<string, boolean>>({});

  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";

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

    setLoading(true);
    fetchMyVenues(token)
      .then(setVenues)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      )
      .finally(() => setLoading(false));
  }, [hydrated, user, token, router]);

  /** Load promoters for a venue (owner only). */
  const loadPromoters = async (venueId: string) => {
    if (!token) return;
    setLoadingPromoters((prev) => ({ ...prev, [venueId]: true }));
    try {
      const list = await fetchVenuePromoters(venueId, token);
      setPromoters((prev) => ({ ...prev, [venueId]: list }));
    } catch {
      // silently fail
    } finally {
      setLoadingPromoters((prev) => ({ ...prev, [venueId]: false }));
    }
  };

  /** Generate an invite code for a venue. */
  const handleGenerateInvite = async (venueId: string) => {
    if (!token) return;
    try {
      const invite = await generateInvite(venueId, token);
      setInvites((prev) => ({ ...prev, [venueId]: invite }));
    } catch {
      // silently fail
    }
  };

  /** Remove a promoter from a venue. */
  const handleRemovePromoter = async (venueId: string, userId: string) => {
    if (!token) return;
    try {
      await removePromoter(venueId, userId, token);
      setPromoters((prev) => ({
        ...prev,
        [venueId]: (prev[venueId] || []).filter((p) => p.userId !== userId),
      }));
    } catch {
      // silently fail
    }
  };

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
          {isOwner
            ? "You haven't registered a venue yet."
            : "You haven't been invited to any venues yet. Ask a venue owner for an invite code."}
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
          <div className="mb-6">
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

          {/* Manage Promoters (owner only) */}
          {isOwner && venue.ownerId === user?.id && (
            <div className="border-t border-zinc-800 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Promoters
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPromoters(venue.id)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    {loadingPromoters[venue.id] ? "Loading..." : "Refresh"}
                  </button>
                  <button
                    onClick={() => handleGenerateInvite(venue.id)}
                    className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                  >
                    Generate invite
                  </button>
                </div>
              </div>

              {/* Show generated invite code */}
              {invites[venue.id] && (
                <div className="mb-3 rounded-lg bg-zinc-800 p-3">
                  <p className="text-xs text-zinc-400">
                    Invite code (expires in 7 days):
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-widest text-white">
                    {invites[venue.id].code}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Share this with your promoter to let them sign up
                  </p>
                </div>
              )}

              {/* Promoter list */}
              {promoters[venue.id] && promoters[venue.id].length > 0 ? (
                <div className="space-y-2">
                  {promoters[venue.id].map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {p.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {p.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePromoter(venue.id, p.userId)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : promoters[venue.id] ? (
                <p className="text-sm text-zinc-500">
                  No promoters yet. Generate an invite code to add one.
                </p>
              ) : (
                <button
                  onClick={() => loadPromoters(venue.id)}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Load promoters
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
