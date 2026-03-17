"use client";

import { VenueType, useVenueStore } from "@vibecheck/shared";

/** Human-readable labels for venue types. */
const venueTypeOptions: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: "Nightclub" },
  { value: VenueType.BAR, label: "Bar" },
  { value: VenueType.RESTAURANT_BAR, label: "Restaurant & Bar" },
  { value: VenueType.LOUNGE, label: "Lounge" },
  { value: VenueType.SHISA_NYAMA, label: "Shisa Nyama" },
  { value: VenueType.ROOFTOP, label: "Rooftop" },
  { value: VenueType.OTHER, label: "Other" },
];

/** Extract unique music genres from loaded venues. */
function useGenreOptions(): string[] {
  const venues = useVenueStore((s) => s.venues);
  const genres = new Set<string>();
  for (const v of venues) {
    for (const g of v.musicGenre) {
      genres.add(g);
    }
  }
  return Array.from(genres).sort();
}

export default function FilterBar() {
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);
  const setVenueTypeFilter = useVenueStore((s) => s.setVenueTypeFilter);
  const setMusicGenreFilter = useVenueStore((s) => s.setMusicGenreFilter);
  const clearFilters = useVenueStore((s) => s.clearFilters);
  const genreOptions = useGenreOptions();

  const hasFilters = venueTypeFilter !== null || musicGenreFilter !== null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Venue type dropdown */}
      <select
        value={venueTypeFilter ?? ""}
        onChange={(e) =>
          setVenueTypeFilter(
            e.target.value ? (e.target.value as VenueType) : null
          )
        }
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
      >
        <option value="">All types</option>
        {venueTypeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Music genre dropdown */}
      <select
        value={musicGenreFilter ?? ""}
        onChange={(e) =>
          setMusicGenreFilter(e.target.value || null)
        }
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
      >
        <option value="">All genres</option>
        {genreOptions.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
