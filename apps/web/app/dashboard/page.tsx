"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  setBaseUrl,
  fetchMyVenues,
  fetchActiveStreams,
  generateInvite,
  fetchVenuePromoters,
  removePromoter,
  deleteClip,
  useAuthStore,
  VenueWithStats,
  VenuePromoter,
  Invite,
  LiveStream,
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
  const [deletingClipIds, setDeletingClipIds] = useState<Record<string, boolean>>({});
  const [openClipMenuId, setOpenClipMenuId] = useState<string | null>(null);
  const [activeStreams, setActiveStreams] = useState<Record<string, LiveStream>>({});

  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";

  const loadDashboard = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const [nextVenues, streams] = await Promise.all([
        fetchMyVenues(authToken),
        fetchActiveStreams(),
      ]);
      setVenues(nextVenues);
      const streamMap: Record<string, LiveStream> = {};
      for (const s of streams) streamMap[s.venueId] = s;
      setActiveStreams(streamMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

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

    loadDashboard(token);
  }, [hydrated, user, token, router]);

  useEffect(() => {
    if (!openClipMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-clip-menu]")) return;
      setOpenClipMenuId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenClipMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openClipMenuId]);

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

  /** Delete a clip and refresh the venue stats/list. */
  const handleDeleteClip = async (clipId: string) => {
    if (!token) return;
    setOpenClipMenuId(null);
    setDeletingClipIds((prev) => ({ ...prev, [clipId]: true }));
    try {
      await deleteClip(clipId, token);
      await loadDashboard(token);
    } catch {
      // silently fail
    } finally {
      setDeletingClipIds((prev) => ({ ...prev, [clipId]: false }));
    }
  };

  if (!hydrated || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 h-7 w-48 rounded bg-zinc-800" />
        <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4">
            <div className="mb-1 h-6 w-36 rounded bg-zinc-800" />
            <div className="h-4 w-48 rounded bg-zinc-800" />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-800 p-4">
                <div className="mx-auto mb-2 h-7 w-12 rounded bg-zinc-700" />
                <div className="mx-auto h-3 w-16 rounded bg-zinc-700" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3">
                <div className="h-12 w-20 shrink-0 rounded bg-zinc-700" />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-32 rounded bg-zinc-700" />
                  <div className="h-3 w-20 rounded bg-zinc-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Venue Dashboard</h1>
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-red-400 hover:text-red-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Venue Dashboard</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-medium text-zinc-300">
            {isOwner ? "No venues yet" : "No venues linked"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {isOwner
              ? "You haven't registered a venue yet."
              : "You haven't been invited to any venues yet. Ask a venue owner for an invite code."}
          </p>
        </div>
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
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold">{venue.name}</h2>
                <p className="text-sm text-zinc-400">{venue.location}</p>
              </div>
              {activeStreams[venue.id] && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE · {activeStreams[venue.id].currentViewerCount} viewers
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-3">
              {activeStreams[venue.id] ? (
                <Link
                  href={`/dashboard/live/${venue.id}`}
                  className="rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/30"
                >
                  View Stream
                </Link>
              ) : (
                <Link
                  href={`/dashboard/live/${venue.id}`}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  Go Live
                </Link>
              )}
              {venue.ownerId === user?.id && (
                <Link
                  href={`/dashboard/edit/${venue.id}`}
                  className="text-sm text-zinc-400 hover:text-white"
                >
                  Edit
                </Link>
              )}
              <Link
                href={`/venues/${venue.id}`}
                className="text-sm text-zinc-400 hover:text-white"
              >
                View &rarr;
              </Link>
            </div>
          </div>

          {/* Stats cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                    <div className="relative shrink-0" data-clip-menu>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenClipMenuId((current) =>
                            current === clip.id ? null : clip.id
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        aria-haspopup="menu"
                        aria-expanded={openClipMenuId === clip.id}
                        aria-label="Clip actions"
                      >
                        <span className="text-lg leading-none">...</span>
                      </button>

                      {openClipMenuId === clip.id && (
                        <div className="absolute right-0 top-10 z-10 w-36 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-lg">
                        <button
                          onClick={() => handleDeleteClip(clip.id)}
                          disabled={!!deletingClipIds[clip.id]}
                          className="block w-full rounded px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingClipIds[clip.id] ? "Removing..." : "Remove"}
                        </button>
                        </div>
                      )}
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
