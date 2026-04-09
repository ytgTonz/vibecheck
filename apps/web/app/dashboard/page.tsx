"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchMyVenues, fetchVenueRecentStreams, generateInvite,
  fetchVenuePromoters, removePromoter, useRequireAuth, useVenueLiveUpdates,
  VenueWithStats, VenuePromoter, Invite, LiveStream,
} from "@vibecheck/shared";
import { VenueStreamCard } from "./components/VenueStreamCard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, ready, hydrated } = useRequireAuth((path) => router.replace(path));
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentStreams, setRecentStreams] = useState<Record<string, LiveStream[]>>({});
  const [loadingStreams, setLoadingStreams] = useState<Record<string, boolean>>({});
  const [promoters, setPromoters] = useState<Record<string, VenuePromoter[]>>({});
  const [invites, setInvites] = useState<Record<string, Invite>>({});
  const [loadingPromoters, setLoadingPromoters] = useState<Record<string, boolean>>({});

  const isOwner = user?.role === "VENUE_OWNER" || user?.role === "ADMIN";

  useVenueLiveUpdates(setVenues);

  const loadDashboard = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const nextVenues = await fetchMyVenues(authToken);
      setVenues(nextVenues);
      setLoadingStreams(Object.fromEntries(nextVenues.map((v) => [v.id, true])));
      nextVenues.forEach(async (venue) => {
        try {
          const streams = await fetchVenueRecentStreams(venue.id);
          setRecentStreams((prev) => ({ ...prev, [venue.id]: streams }));
        } catch {
          setRecentStreams((prev) => ({ ...prev, [venue.id]: [] }));
        } finally {
          setLoadingStreams((prev) => ({ ...prev, [venue.id]: false }));
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready && token) loadDashboard(token);
  }, [ready, token]);

  const loadPromoters = async (venueId: string) => {
    if (!token) return;
    setLoadingPromoters((prev) => ({ ...prev, [venueId]: true }));
    try {
      const list = await fetchVenuePromoters(venueId, token);
      setPromoters((prev) => ({ ...prev, [venueId]: list }));
    } catch { /* silently fail */ } finally {
      setLoadingPromoters((prev) => ({ ...prev, [venueId]: false }));
    }
  };

  const handleGenerateInvite = async (venueId: string) => {
    if (!token) return;
    try {
      const invite = await generateInvite(venueId, token);
      setInvites((prev) => ({ ...prev, [venueId]: invite }));
    } catch { /* silently fail */ }
  };

  const handleRemovePromoter = async (venueId: string, userId: string) => {
    if (!token) return;
    try {
      await removePromoter(venueId, userId, token);
      setPromoters((prev) => ({ ...prev, [venueId]: (prev[venueId] || []).filter((p) => p.userId !== userId) }));
    } catch { /* silently fail */ }
  };

  if (!ready || loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-3 h-6 w-40 rounded bg-zinc-800" />
            <div className="h-4 w-28 rounded bg-zinc-800" />
            <div className="mt-4 h-16 rounded-lg bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-xs text-red-400 hover:text-red-300">
          Try again
        </button>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <p className="text-lg font-semibold text-zinc-200">{isOwner ? "No venues yet" : "No venues linked"}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {isOwner
            ? "You haven't registered a venue yet."
            : "You haven't been invited to any venues yet. Ask a venue owner for an invite code."}
        </p>
        {isOwner && (
          <Link href="/dashboard/new" className="mt-5 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200">
            Add venue
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex justify-end">
          <Link href="/dashboard/new" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200">
            Add venue
          </Link>
        </div>
      )}
      {venues.map((venue) => (
        <VenueStreamCard
          key={venue.id}
          venue={venue}
          user={user}
          token={token ?? ""}
          isOwner={isOwner}
          recentStreams={recentStreams[venue.id] ?? []}
          loadingStreams={loadingStreams[venue.id] ?? true}
          promoters={promoters[venue.id]}
          invite={invites[venue.id]}
          loadingPromoters={loadingPromoters[venue.id] ?? false}
          onLoadPromoters={() => loadPromoters(venue.id)}
          onGenerateInvite={() => handleGenerateInvite(venue.id)}
          onRemovePromoter={(userId) => handleRemovePromoter(venue.id, userId)}
        />
      ))}
    </div>
  );
}
