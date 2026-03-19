"use client";

import { useEffect } from "react";
import { setBaseUrl, useVenueStore, Venue } from "@vibecheck/shared";
import VenueCard from "./components/VenueCard";
import FeaturedVenueCard from "./components/FeaturedVenueCard";
import FilterBar from "./components/FilterBar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

function VenueSection({
  title,
  venues,
}: {
  title: string;
  venues: Venue[];
}) {
  if (venues.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        {title}
      </h3>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const loading = useVenueStore((s) => s.loading);
  const error = useVenueStore((s) => s.error);
  const loadVenues = useVenueStore((s) => s.loadVenues);
  const groupedVenues = useVenueStore((s) => s.groupedVenues);
  const filteredVenues = useVenueStore((s) => s.filteredVenues);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const groups = groupedVenues();
  const filtered = filteredVenues();
  const liveCount = groups.live.length;

  // Featured venue: first live, or first fresh, or first quiet
  const featuredVenue =
    groups.live[0] ?? groups.fresh[0] ?? groups.quiet[0] ?? null;

  // Remove featured venue from its section to avoid duplication
  const excludeFeatured = (venues: Venue[]) =>
    featuredVenue ? venues.filter((v) => v.id !== featuredVenue.id) : venues;

  const liveSectionVenues = excludeFeatured(groups.live);
  const freshSectionVenues = excludeFeatured(groups.fresh);
  const quietSectionVenues = excludeFeatured(groups.quiet);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 px-5 py-6 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:px-7 sm:py-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200/75">
            Tonight In East London
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Open the venue stories before you decide where to pull up.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
            The browse page now works like a live directory: each venue card previews the
            energy, recency, and feel of its latest story rather than looking like a plain listing.
          </p>
        </div>
      </section>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Browse Stories
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Scan the latest venue energy first, then open the full feed that feels right.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <FilterBar />
      </div>

      {!loading && !error && filtered.length > 0 && (
        <p className="mb-6 text-xs text-zinc-500">
          {filtered.length} venue{filtered.length !== 1 ? "s" : ""}
          {liveCount > 0 && ` · ${liveCount} live now`}
        </p>
      )}

      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-5"
            >
              <div className="mb-5 flex gap-1.5">
                <div className="h-1 flex-1 rounded-full bg-zinc-800" />
                <div className="h-1 flex-1 rounded-full bg-zinc-900" />
                <div className="h-1 flex-1 rounded-full bg-zinc-900" />
              </div>
              <div className="mb-4 h-4 w-20 rounded bg-zinc-800" />
              <div className="mb-3 h-8 w-48 rounded bg-zinc-800" />
              <div className="mb-5 h-4 w-40 rounded bg-zinc-800" />
              <div className="mb-5 flex gap-2">
                <div className="h-7 w-28 rounded-full bg-zinc-800" />
                <div className="h-7 w-24 rounded-full bg-zinc-800" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-zinc-800" />
                <div className="h-6 w-14 rounded-full bg-zinc-800" />
                <div className="h-6 w-18 rounded-full bg-zinc-800" />
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

      {!loading && !error && filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">No venues match your filters</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          {featuredVenue && (
            <div className="mb-8">
              <FeaturedVenueCard venue={featuredVenue} />
            </div>
          )}

          <VenueSection title="Live now" venues={liveSectionVenues} />
          <VenueSection title="Fresh tonight" venues={freshSectionVenues} />
          <VenueSection title="More venues" venues={quietSectionVenues} />
        </>
      )}
    </div>
  );
}
