"use client";

import { useEffect } from "react";
import { setBaseUrl, useVenueStore } from "@vibecheck/shared";
import VenueCard from "./components/VenueCard";
import FilterBar from "./components/FilterBar";

// Point the API client at the right server.
// In production you'd use an env var; for now, localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

export default function BrowsePage() {
  const loading = useVenueStore((s) => s.loading);
  const error = useVenueStore((s) => s.error);
  const loadVenues = useVenueStore((s) => s.loadVenues);
  const allVenues = useVenueStore((s) => s.venues);
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);

  const venues = allVenues.filter((venue) => {
    if (venueTypeFilter && venue.type !== venueTypeFilter) return false;
    if (musicGenreFilter && !venue.musicGenre.includes(musicGenreFilter)) return false;
    return true;
  });

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Subtitle */}
      <p className="mb-6 text-zinc-500 dark:text-zinc-400">
        See the vibe before you arrive — East London
      </p>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar />
      </div>

      {/* Content */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="h-5 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mb-3 h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-5 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => loadVenues()}
            className="mt-3 text-xs text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && venues.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">No venues match your filters</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {!loading && !error && venues.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}
