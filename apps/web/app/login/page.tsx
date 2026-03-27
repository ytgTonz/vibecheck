"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@vibecheck/shared";
import { AccountTypeSelector } from "./components/AccountTypeSelector";
import { VenueFields } from "./components/VenueFields";
import { PromoterFields } from "./components/PromoterFields";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loading, error } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountType, setAccountType] = useState<"owner" | "promoter" | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [venueHours, setVenueHours] = useState("");
  const [venueGenres, setVenueGenres] = useState<string[]>([]);

  const [inviteCode, setInviteCode] = useState("");

  const toggleGenre = (genre: string) => {
    setVenueGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        if (accountType === "owner") {
          await register({
            accountType: "owner", email, password, name,
            venue: {
              name: venueName, type: venueType, location: venueLocation,
              hours: venueHours || undefined,
              musicGenre: venueGenres.length > 0 ? venueGenres : undefined,
            },
          });
          router.push("/dashboard");
        } else if (accountType === "promoter") {
          await register({ accountType: "promoter", email, password, name, inviteCode });
          router.push("/dashboard");
        }
      } else {
        await login(email, password);
        router.push("/browse");
      }
    } catch {
      // error is already set in the store
    }
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

      {mode === "register" && !accountType && (
        <AccountTypeSelector onSelect={setAccountType} />
      )}

      {(mode === "login" || accountType) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && accountType && (
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                {accountType === "owner" ? "Venue Owner" : "Venue Promoter"}
              </span>
              <button type="button" onClick={resetForm} className="text-xs text-zinc-500 hover:text-zinc-300">
                Change
              </button>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">Name</label>
              <input
                id="name" type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass} placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">Email</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass} placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">Password</label>
            <input
              id="password" type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass} placeholder="Min 8 characters"
            />
          </div>

          {mode === "register" && accountType === "owner" && (
            <VenueFields
              venueName={venueName} venueType={venueType} venueLocation={venueLocation}
              venueHours={venueHours} venueGenres={venueGenres} inputClass={inputClass}
              onVenueNameChange={setVenueName} onVenueTypeChange={setVenueType}
              onVenueLocationChange={setVenueLocation} onVenueHoursChange={setVenueHours}
              onToggleGenre={toggleGenre}
            />
          )}

          {mode === "register" && accountType === "promoter" && (
            <PromoterFields
              inviteCode={inviteCode} inputClass={inputClass}
              onInviteCodeChange={setInviteCode}
            />
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button onClick={() => { setMode("register"); resetForm(); }} className="text-zinc-300 hover:text-white">
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => { setMode("login"); resetForm(); }} className="text-zinc-300 hover:text-white">
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
