"use client";

import { VenueType, useVenueStore } from "@vibecheck/shared";

const venueTypeOptions: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: "Nightclub" },
  { value: VenueType.BAR, label: "Bar" },
  { value: VenueType.RESTAURANT_BAR, label: "Restaurant & Bar" },
  { value: VenueType.LOUNGE, label: "Lounge" },
  { value: VenueType.SHISA_NYAMA, label: "Shisa Nyama" },
  { value: VenueType.ROOFTOP, label: "Rooftop" },
  { value: VenueType.OTHER, label: "Other" },
];

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
    <div className="space-y-3">
      {/* Venue type pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setVenueTypeFilter(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            venueTypeFilter === null
              ? "bg-white text-zinc-900"
              : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
          }`}
        >
          All
        </button>
        {venueTypeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() =>
              setVenueTypeFilter(
                venueTypeFilter === opt.value ? null : opt.value
              )
            }
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              venueTypeFilter === opt.value
                ? "bg-white text-zinc-900"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Genre dropdown + clear */}
      <div className="flex items-center gap-3">
        <select
          value={musicGenreFilter ?? ""}
          onChange={(e) => setMusicGenreFilter(e.target.value || null)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
        >
          <option value="">All genres</option>
          {genreOptions.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
