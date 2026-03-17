import { Venue } from "@vibecheck/shared";

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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600">
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
    </div>
  );
}
