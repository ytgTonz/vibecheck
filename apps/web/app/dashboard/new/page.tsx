"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createVenue,
  useRequireAuth,
  VenueType,
  VENUE_TYPE_OPTIONS,
  MUSIC_GENRES,
} from "@vibecheck/shared";

export default function NewVenuePage() {
  const router = useRouter();
  const { user, token, ready } = useRequireAuth((path) => router.replace(path));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<string>(VenueType.BAR);
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [musicGenre, setMusicGenre] = useState<string[]>([]);
  const [coverCharge, setCoverCharge] = useState("");
  const [drinkPrices, setDrinkPrices] = useState("");

  useEffect(() => {
    if (ready && user?.role !== "VENUE_OWNER") {
      router.replace("/dashboard");
    }
  }, [ready, user, router]);

  const toggleGenre = (genre: string) => {
    setMusicGenre((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);

    try {
      await createVenue(
        {
          name,
          type: type as VenueType,
          location,
          hours: hours || undefined,
          musicGenre: musicGenre.length > 0 ? musicGenre : undefined,
          coverCharge: coverCharge || undefined,
          drinkPrices: drinkPrices || undefined,
        },
        token
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venue");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-50";

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg animate-pulse space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="mb-1 h-3 w-20 rounded bg-zinc-800" />
            <div className="h-10 w-full rounded-lg bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
            Venue name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className={inputClass}
            placeholder="e.g. The Lounge"
          />
        </div>

        <div>
          <label htmlFor="type" className="mb-1 block text-sm text-zinc-400">
            Venue type
          </label>
          <select
            id="type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={saving}
            className={inputClass}
          >
            {VENUE_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="mb-1 block text-sm text-zinc-400">
            Location
          </label>
          <input
            id="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={saving}
            className={inputClass}
            placeholder="e.g. 12 Main St, City Centre"
          />
        </div>

        <div>
          <label htmlFor="hours" className="mb-1 block text-sm text-zinc-400">
            Hours
          </label>
          <input
            id="hours"
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={saving}
            className={inputClass}
            placeholder="e.g. Fri–Sat 9PM–4AM"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">
            Music genres
          </label>
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                disabled={saving}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  musicGenre.includes(genre)
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="coverCharge" className="mb-1 block text-sm text-zinc-400">
            Cover charge
          </label>
          <input
            id="coverCharge"
            type="text"
            value={coverCharge}
            onChange={(e) => setCoverCharge(e.target.value)}
            disabled={saving}
            className={inputClass}
            placeholder="e.g. R50 before 10PM, R100 after"
          />
        </div>

        <div>
          <label htmlFor="drinkPrices" className="mb-1 block text-sm text-zinc-400">
            Drink prices
          </label>
          <textarea
            id="drinkPrices"
            value={drinkPrices}
            onChange={(e) => setDrinkPrices(e.target.value)}
            disabled={saving}
            rows={3}
            className={inputClass}
            placeholder="e.g. Beer R30, Cocktails R60-R90, Shooters R25"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create venue"}
        </button>
      </form>
    </div>
  );
}
