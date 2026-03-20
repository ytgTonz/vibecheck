"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { setBaseUrl, fetchVenue, fetchVenueClips, recordClipView, Venue, Clip, useAuthStore } from "@vibecheck/shared";
import ClipCard from "../../components/ClipCard";

const VideoPlayer = dynamic(() => import("../../components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

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

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    Promise.all([fetchVenue(id), fetchVenueClips(id)])
      .then(([venueData, clipsData]) => {
        setVenue(venueData);
        setClips(clipsData);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load venue");
      })
      .finally(() => setLoading(false));
  }, [id]);

  /** Record a view and update the local clip count immediately. */
  const handleView = useCallback((clipId: string) => {
    recordClipView(clipId)
      .then(({ views }) => {
        setClips((prev) =>
          prev.map((c) => (c.id === clipId ? { ...c, views } : c))
        );
      })
      .catch(() => {});
  }, []);

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
        <div className="mt-8">
          <div className="mb-4 h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            ))}
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

  // Most recent clip determines "last updated"
  const lastClipDate = clips.length > 0 ? clips[0].createdAt : null;
  const featuredClip = clips[0] ?? null;
  const railClips = clips.slice(1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      {/* Back link */}
      <Link
        href="/browse"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        &larr; All venues
      </Link>

      {venue.isLive && venue.activeStreamId && (
        <Link
          href={`/venues/${venue.id}/live`}
          className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 transition-colors hover:bg-red-500/15"
        >
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-red-400">
            This venue is streaming live right now
          </span>
          <span className="ml-auto text-sm text-red-300">
            Watch live &rarr;
          </span>
        </Link>
      )}

      <section className="mb-8 overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(135deg,#120a07_0%,#2c170d_36%,#0b0c10_100%)] text-white shadow-[0_28px_80px_rgba(17,12,10,0.18)] dark:border-zinc-800">
        <div className="grid gap-8 px-5 py-6 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-100/85">
                Live Venue Feed
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-200">
                {venueTypeLabel[venue.type] ?? venue.type}
              </span>
            </div>

            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {venue.name}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-200/85 sm:text-base">
              Fast, recent clips that show whether the room is warm, packed, or worth the drive.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm text-zinc-100/90">
                {venue.location}
              </span>
              {lastClipDate && (
                <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm text-zinc-100/90">
                  Updated {timeAgo(lastClipDate)}
                </span>
              )}
              {clips.length > 0 && (
                <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm text-zinc-100/90">
                  {clips.length} clips live
                </span>
              )}
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

          <div className="w-full lg:max-w-md">
            {featuredClip ? (
              <ClipCard
                clip={featuredClip}
                featured
                onPlay={() => setActiveClipIndex(0)}
              />
            ) : (
              <div className="flex h-[28rem] w-full items-end rounded-[1.75rem] border border-white/10 bg-black/30 p-6 sm:h-[32rem]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-200/80">
                    No clips yet
                  </p>
                  <p className="mt-3 max-w-sm text-2xl font-semibold leading-tight text-white">
                    This venue is waiting for its first vibe drop.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
              {featuredClip ? "More Stories" : "Story Rail"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tap through the latest clips like status updates, not gallery cards.
            </p>
          </div>
        </div>

        {clips.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No clips yet. Be the first to share the vibe.
          </p>
        ) : railClips.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            One live clip is up now. More stories will stack here as the night fills out.
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            <div className="flex gap-4">
              {railClips.map((clip, index) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  onPlay={() => setActiveClipIndex(index + 1)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Venue Details</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              The practical stuff after the vibe passes the test.
            </p>
          </div>
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

      {activeClipIndex !== null && clips[activeClipIndex] && (
        <VideoPlayer
          clips={clips}
          activeIndex={activeClipIndex}
          venueName={venue.name}
          onClose={() => setActiveClipIndex(null)}
          onNavigate={setActiveClipIndex}
          onView={handleView}
        />
      )}
    </div>
  );
}
