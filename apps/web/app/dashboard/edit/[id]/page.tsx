"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchVenue,
  updateVenue,
  useAuthStore,
  Venue,
  VenueType,
} from "@vibecheck/shared";

const VENUE_TYPES: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: "Nightclub" },
  { value: VenueType.BAR, label: "Bar" },
  { value: VenueType.RESTAURANT_BAR, label: "Restaurant & Bar" },
  { value: VenueType.LOUNGE, label: "Lounge" },
  { value: VenueType.SHISA_NYAMA, label: "Shisa Nyama" },
  { value: VenueType.ROOFTOP, label: "Rooftop" },
  { value: VenueType.OTHER, label: "Other" },
];

const MUSIC_GENRES = [
  "Afrobeats",
  "Amapiano",
  "R&B",
  "Hip Hop",
  "House",
  "Jazz",
  "Soul",
  "Kwaito",
  "Dancehall",
  "Other",
];

export default function EditVenuePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState("");
  const [musicGenre, setMusicGenre] = useState<string[]>([]);
  const [coverCharge, setCoverCharge] = useState("");
  const [drinkPrices, setDrinkPrices] = useState("");

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !token) {
      router.replace("/login");
      return;
    }
  }, [hydrated, user, token, router]);

  // Load venue data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchVenue(id)
      .then((v) => {
        setVenue(v);
        setName(v.name);
        setType(v.type);
        setLocation(v.location);
        setHours(v.hours || "");
        setMusicGenre(v.musicGenre);
        setCoverCharge(v.coverCharge || "");
        setDrinkPrices(v.drinkPrices || "");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load venue")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const toggleGenre = (genre: string) => {
    setMusicGenre((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateVenue(
        id,
        {
          name,
          type: type as VenueType,
          location,
          hours: hours || null,
          musicGenre,
          coverCharge: coverCharge || null,
          drinkPrices: drinkPrices || null,
        },
        token
      );
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update venue");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none disabled:opacity-50";

  if (!hydrated || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 h-4 w-32 rounded bg-zinc-800" />
        <div className="mb-6 h-7 w-28 rounded bg-zinc-800" />
        <div className="animate-pulse space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="mb-1 h-3 w-20 rounded bg-zinc-800" />
              <div className="h-10 w-full rounded-lg bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !venue) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
          <Link href="/dashboard" className="mt-3 inline-block text-xs text-red-400 hover:text-red-300">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Only owner can edit
  if (venue && user && venue.ownerId !== user.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm font-medium text-red-400">You don&apos;t have permission to edit this venue.</p>
          <Link href="/dashboard" className="mt-3 inline-block text-xs text-red-400 hover:text-red-300">
            &larr; Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
      >
        &larr; Back to dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit Venue</h1>

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
            {VENUE_TYPES.map((t) => (
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
        {success && (
          <p className="text-sm text-green-400">Venue updated successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
