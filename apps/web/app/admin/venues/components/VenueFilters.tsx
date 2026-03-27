const VENUE_TYPE_OPTIONS = ["ALL", "NIGHTCLUB", "BAR", "RESTAURANT_BAR", "LOUNGE", "SHISA_NYAMA", "ROOFTOP", "OTHER"] as const;

interface VenueFiltersProps {
  query: string;
  type: string;
  hasFilters: boolean;
  onQueryChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onClear: () => void;
}

export function VenueFilters({ query, type, hasFilters, onQueryChange, onTypeChange, onClear }: VenueFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search venue, location, owner name, or email"
        className="min-w-[240px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
      />
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
      >
        {VENUE_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? "All venue types" : option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button onClick={onClear} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
          Clear
        </button>
      )}
    </div>
  );
}
