import { VENUE_TYPE_OPTIONS, MUSIC_GENRES } from "@vibecheck/shared";

interface VenueFieldsProps {
  venueName: string;
  venueType: string;
  venueLocation: string;
  venueHours: string;
  venueGenres: string[];
  inputClass: string;
  onVenueNameChange: (v: string) => void;
  onVenueTypeChange: (v: string) => void;
  onVenueLocationChange: (v: string) => void;
  onVenueHoursChange: (v: string) => void;
  onToggleGenre: (genre: string) => void;
}

export function VenueFields({
  venueName, venueType, venueLocation, venueHours, venueGenres, inputClass,
  onVenueNameChange, onVenueTypeChange, onVenueLocationChange, onVenueHoursChange, onToggleGenre,
}: VenueFieldsProps) {
  return (
    <>
      <hr className="border-zinc-800" />
      <p className="text-sm font-medium text-zinc-300">Venue details</p>

      <div>
        <label htmlFor="venueName" className="mb-1 block text-sm text-zinc-400">Venue name</label>
        <input
          id="venueName" type="text" required value={venueName}
          onChange={(e) => onVenueNameChange(e.target.value)}
          className={inputClass} placeholder="e.g. Sky Lounge"
        />
      </div>

      <div>
        <label htmlFor="venueType" className="mb-1 block text-sm text-zinc-400">Venue type</label>
        <select
          id="venueType" required value={venueType}
          onChange={(e) => onVenueTypeChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Select type</option>
          {VENUE_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="venueLocation" className="mb-1 block text-sm text-zinc-400">Location</label>
        <input
          id="venueLocation" type="text" required value={venueLocation}
          onChange={(e) => onVenueLocationChange(e.target.value)}
          className={inputClass} placeholder="e.g. Quigney, East London"
        />
      </div>

      <div>
        <label htmlFor="venueHours" className="mb-1 block text-sm text-zinc-400">Hours (optional)</label>
        <input
          id="venueHours" type="text" value={venueHours}
          onChange={(e) => onVenueHoursChange(e.target.value)}
          className={inputClass} placeholder="e.g. Fri–Sat 9PM–4AM"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Music genres (optional)</label>
        <div className="flex flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre} type="button" onClick={() => onToggleGenre(genre)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                venueGenres.includes(genre)
                  ? "bg-white text-zinc-900"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
