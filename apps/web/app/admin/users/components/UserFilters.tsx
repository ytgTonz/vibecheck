const ROLE_OPTIONS = ["ALL", "ADMIN", "VENUE_OWNER", "VENUE_PROMOTER", "VIEWER"] as const;

interface UserFiltersProps {
  query: string;
  role: string;
  hasFilters: boolean;
  onQueryChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onClear: () => void;
  showSearch?: boolean;
  showClear?: boolean;
}

export function UserFilters({
  query,
  role,
  hasFilters,
  onQueryChange,
  onRoleChange,
  onClear,
  showSearch = true,
  showClear = true,
}: UserFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {showSearch && (
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search name or email"
          className="min-w-[220px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
      )}
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === "ALL" ? "All roles" : option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {showClear && hasFilters && (
        <button
          onClick={onClear}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          Clear
        </button>
      )}
    </div>
  );
}
