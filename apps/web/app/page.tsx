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
  const filteredVenues = useVenueStore((s) => s.filteredVenues);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const venues = filteredVenues();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">VibeCheck</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          See the vibe before you arrive — East London
        </p>
      </header>

      {/* Filters */}
      <div className="mb-6">
        <FilterBar />
      </div>

      {/* Content */}
      {loading && (
        <p className="text-zinc-400 dark:text-zinc-500">Loading venues…</p>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
      )}

      {!loading && !error && venues.length === 0 && (
        <p className="text-zinc-400 dark:text-zinc-500">No venues match your filters.</p>
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
