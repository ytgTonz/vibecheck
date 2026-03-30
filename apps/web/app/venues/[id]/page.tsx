"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchVenue, Venue, useAuthStore } from "@vibecheck/shared";

/** Human-readable labels for venue types. */
const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: "Nightclub",
  BAR: "Bar",
  RESTAURANT_BAR: "Restaurant & Bar",
  LOUNGE: "Lounge",
  SHISA_NYAMA: "Shisa Nyama",
  ROOFTOP: "Rooftop",
  OTHER: "Other",
};

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetchVenue(id)
      .then((venueData) => setVenue(venueData))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load venue");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="h-7 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="grid gap-y-3 sm:grid-cols-2 sm:gap-x-6">
            <div>
              <div className="mb-1 h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div>
              <div className="mb-1 h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error || "Venue not found"}</p>
          <Link href="/browse" className="mt-3 inline-block text-xs text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300">
            &larr; Back to venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/browse"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        &larr; All venues
      </Link>

      {/* Live stream hero */}
      {venue.isLive && venue.activeStreamId ? (
        <Link
          href={`/venues/${venue.id}/live`}
          className="mb-8 flex flex-wrap items-center gap-4 rounded-[2rem] border border-brand-red/30 bg-brand-red/10 px-6 py-6 transition-colors hover:bg-brand-red/15"
        >
          <span className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-brand-red" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-red-400">
              This venue is streaming live right now
            </p>
            <p className="text-sm text-red-300/80">
              Tap to watch the live stream
            </p>
          </div>
          <span className="text-sm font-medium text-red-300">
            Watch live &rarr;
          </span>
        </Link>
      ) : (
        <div className="mb-8 flex items-center gap-3 rounded-[2rem] border border-zinc-800 bg-zinc-900/50 px-6 py-5">
          <span className="h-3 w-3 rounded-full bg-zinc-500" />
          <p className="text-sm text-zinc-400">
            This venue is currently offline. Check back later for a live stream.
          </p>
        </div>
      )}

      {/* Venue info header */}
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(135deg,#120a07_0%,#2c170d_36%,#0b0c10_100%)] text-white shadow-[0_28px_80px_rgba(17,12,10,0.18)] dark:border-zinc-800">
        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-red/80">
              Venue
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-200">
              {venueTypeLabel[venue.type] ?? venue.type}
            </span>
          </div>

          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {venue.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm text-zinc-100/90">
              {venue.location}
            </span>
            {user && venue.ownerId === user.id && (
              <span className="rounded-full bg-emerald-400/18 px-3 py-1.5 text-sm font-medium text-emerald-200">
                You own this venue
              </span>
            )}
          </div>

          {venue.musicGenre.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {venue.musicGenre.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.16em] text-zinc-100/85"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Venue details */}
      <section className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-tight">Venue Details</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The practical stuff for planning your night.
          </p>
        </div>

        <dl className="grid gap-y-4 text-sm sm:grid-cols-2 sm:gap-x-8">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
            <dd className="font-medium">{venue.location}</dd>
          </div>

          {venue.hours && (
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Hours</dt>
              <dd className="font-medium">{venue.hours}</dd>
            </div>
          )}

          {venue.musicGenre.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="mb-2 text-zinc-500 dark:text-zinc-400">Music</dt>
              <dd className="flex flex-wrap gap-2">
                {venue.musicGenre.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </dd>
            </div>
          )}

          {venue.coverCharge && (
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Cover</dt>
              <dd className="font-medium">{venue.coverCharge}</dd>
            </div>
          )}

          {venue.drinkPrices && (
            <div className="sm:col-span-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Drinks</dt>
              <dd className="whitespace-pre-line font-medium">{venue.drinkPrices}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
