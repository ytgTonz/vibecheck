"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setBaseUrl, useAuthStore, VenueType } from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

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

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loading, error } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountType, setAccountType] = useState<"owner" | "promoter" | null>(
    null
  );

  // User fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Owner fields
  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [venueHours, setVenueHours] = useState("");
  const [venueGenres, setVenueGenres] = useState<string[]>([]);

  // Promoter fields
  const [inviteCode, setInviteCode] = useState("");

  const toggleGenre = (genre: string) => {
    setVenueGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "register") {
        if (accountType === "owner") {
          await register({
            accountType: "owner",
            email,
            password,
            name,
            venue: {
              name: venueName,
              type: venueType,
              location: venueLocation,
              hours: venueHours || undefined,
              musicGenre: venueGenres.length > 0 ? venueGenres : undefined,
            },
          });
          router.push("/dashboard");
        } else if (accountType === "promoter") {
          await register({
            accountType: "promoter",
            email,
            password,
            name,
            inviteCode,
          });
          router.push("/upload");
        }
      } else {
        await login(email, password);
        router.push("/");
      }
    } catch {
      // error is already set in the store
    }
  };

  const resetForm = () => {
    setAccountType(null);
    setEmail("");
    setPassword("");
    setName("");
    setVenueName("");
    setVenueType("");
    setVenueLocation("");
    setVenueHours("");
    setVenueGenres([]);
    setInviteCode("");
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        &larr; Back
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>

      {/* Account type selector (register mode only) */}
      {mode === "register" && !accountType && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">I am a...</p>
          <button
            onClick={() => setAccountType("owner")}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500"
          >
            <p className="font-medium">Venue Owner</p>
            <p className="mt-1 text-sm text-zinc-400">
              Register your venue and manage promoters
            </p>
          </button>
          <button
            onClick={() => setAccountType("promoter")}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500"
          >
            <p className="font-medium">Venue Promoter</p>
            <p className="mt-1 text-sm text-zinc-400">
              I have an invite code from a venue owner
            </p>
          </button>
        </div>
      )}

      {/* Form (login mode, or register mode with account type selected) */}
      {(mode === "login" || accountType) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account type badge (register mode) */}
          {mode === "register" && accountType && (
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                {accountType === "owner" ? "Venue Owner" : "Venue Promoter"}
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Change
              </button>
            </div>
          )}

          {/* Name (register only) */}
          {mode === "register" && (
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm text-zinc-400"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-zinc-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Min 8 characters"
            />
          </div>

          {/* ─── Owner: venue fields ─────────────────────────────────── */}
          {mode === "register" && accountType === "owner" && (
            <>
              <hr className="border-zinc-800" />
              <p className="text-sm font-medium text-zinc-300">Venue details</p>

              <div>
                <label
                  htmlFor="venueName"
                  className="mb-1 block text-sm text-zinc-400"
                >
                  Venue name
                </label>
                <input
                  id="venueName"
                  type="text"
                  required
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Sky Lounge"
                />
              </div>

              <div>
                <label
                  htmlFor="venueType"
                  className="mb-1 block text-sm text-zinc-400"
                >
                  Venue type
                </label>
                <select
                  id="venueType"
                  required
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select type</option>
                  {VENUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="venueLocation"
                  className="mb-1 block text-sm text-zinc-400"
                >
                  Location
                </label>
                <input
                  id="venueLocation"
                  type="text"
                  required
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Quigney, East London"
                />
              </div>

              <div>
                <label
                  htmlFor="venueHours"
                  className="mb-1 block text-sm text-zinc-400"
                >
                  Hours (optional)
                </label>
                <input
                  id="venueHours"
                  type="text"
                  value={venueHours}
                  onChange={(e) => setVenueHours(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Fri–Sat 9PM–4AM"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Music genres (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_GENRES.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
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
          )}

          {/* ─── Promoter: invite code ───────────────────────────────── */}
          {mode === "register" && accountType === "promoter" && (
            <div>
              <label
                htmlFor="inviteCode"
                className="mb-1 block text-sm text-zinc-400"
              >
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="e.g. A1B2C3D4"
                maxLength={8}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Get this from the venue owner
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              onClick={() => {
                setMode("register");
                resetForm();
              }}
              className="text-zinc-300 hover:text-white"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setMode("login");
                resetForm();
              }}
              className="text-zinc-300 hover:text-white"
            >
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
