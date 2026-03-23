"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchMyVenues,
  generateInvite,
  fetchVenuePromoters,
  removePromoter,
  useAuthStore,
  VenueWithStats,
  VenuePromoter,
  Invite,
} from "@vibecheck/shared";

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

  const loadDashboard = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const nextVenues = await fetchMyVenues(authToken);
      setVenues(nextVenues);
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
        <div className="mb-6 h-7 w-48 rounded bg-zinc-800" />
        <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4">
            <div className="mb-1 h-6 w-36 rounded bg-zinc-800" />
            <div className="h-4 w-48 rounded bg-zinc-800" />
          </div>
          <div className="mb-6 h-16 rounded-lg bg-zinc-800" />
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
              {venue.isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE · {venue.currentViewerCount} viewers
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-3">
              {venue.isLive ? (
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

          {/* Go Live CTA when not streaming */}
          {!venue.isLive && (
            <Link
              href={`/dashboard/live/${venue.id}`}
              className="mb-6 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 transition-colors hover:border-red-500/30 hover:bg-red-500/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <svg className="ml-0.5 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-200">Start a live stream</p>
                <p className="text-xs text-zinc-500">Broadcast to your audience in real time</p>
              </div>
            </Link>
          )}

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
