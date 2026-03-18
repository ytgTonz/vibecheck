"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { setBaseUrl, fetchVenue, fetchVenueClips, Venue, Clip } from "@vibecheck/shared";
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

  const [venue, setVenue] = useState<Venue | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingClip, setPlayingClip] = useState<Clip | null>(null);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-zinc-400 dark:text-zinc-500">Loading venue...</p>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error || "Venue not found"}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-300">
          &larr; Back to venues
        </Link>
      </div>
    );
  }

  // Most recent clip determines "last updated"
  const lastClipDate = clips.length > 0 ? clips[0].createdAt : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        &larr; All venues
      </Link>

      {/* Venue info card */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{venue.name}</h1>
          <span className="shrink-0 rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {venueTypeLabel[venue.type] ?? venue.type}
          </span>
        </div>

        {/* Details grid */}
        <dl className="grid gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-6">
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
              <dt className="mb-1 text-zinc-500 dark:text-zinc-400">Music</dt>
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
        </dl>

        {/* Last updated */}
        {lastClipDate && (
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            Last updated {timeAgo(lastClipDate)}
          </p>
        )}
      </div>

      {/* Video player (when a clip is selected) */}
      {playingClip && (
        <div className="mb-8">
          <VideoPlayer
            clip={playingClip}
            onClose={() => setPlayingClip(null)}
          />
        </div>
      )}

      {/* Clips section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Vibe Clips {clips.length > 0 && <span className="text-zinc-500">({clips.length})</span>}
        </h2>

        {clips.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No clips yet. Be the first to share the vibe!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} onPlay={setPlayingClip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
