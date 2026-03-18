import Link from "next/link";
import { Venue } from "@vibecheck/shared";

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

export default function VenueCard({ venue }: { venue: Venue }) {
  return (
    <Link
      href={`/venues/${venue.id}`}
      className="block rounded-xl border border-zinc-200 bg-zinc-50 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      {/* Header: name + type badge */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">{venue.name}</h2>
        <span className="shrink-0 rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {venueTypeLabel[venue.type] ?? venue.type}
        </span>
      </div>

      {/* Location */}
      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{venue.location}</p>

      {/* Hours */}
      {venue.hours && (
        <p className="mb-3 text-sm text-zinc-400 dark:text-zinc-500">
          <span className="text-zinc-500 dark:text-zinc-400">Hours:</span> {venue.hours}
        </p>
      )}

      {/* Music genre tags */}
      {venue.musicGenre.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {venue.musicGenre.map((genre) => (
            <span
              key={genre}
              className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {genre}
            </span>
          ))}
        </div>
      )}

      {/* Last updated */}
      {venue.lastClipAt && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          Updated {timeAgo(venue.lastClipAt)}
        </p>
      )}
    </Link>
  );
}
