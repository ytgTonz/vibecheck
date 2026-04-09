"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore, register as apiRegister } from "@vibecheck/shared";
import { AccountTypeSelector } from "./components/AccountTypeSelector";
import { VenueFields } from "./components/VenueFields";
import { PromoterFields } from "./components/PromoterFields";
import { ViewerFields } from "./components/ViewerFields";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, loading, error, setAuth } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountType, setAccountType] = useState<"owner" | "promoter" | "viewer" | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [venueName, setVenueName] = useState("");
  const [venueType, setVenueType] = useState("");
  const [venueLocation, setVenueLocation] = useState("");
  const [venueHours, setVenueHours] = useState("");
  const [venueGenres, setVenueGenres] = useState<string[]>([]);

  const [inviteCode, setInviteCode] = useState("");

  const [viewerLoading, setViewerLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const accountTypeParam = searchParams.get("accountType");

    if (modeParam === "register") {
      setMode("register");
    } else if (modeParam === "login") {
      setMode("login");
    }

    if (
      accountTypeParam === "owner" ||
      accountTypeParam === "promoter" ||
      accountTypeParam === "viewer"
    ) {
      setMode("register");
      setAccountType(accountTypeParam);
    }
  }, [searchParams]);

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
    setPhone("");
    setVenueName("");
    setVenueType("");
    setVenueLocation("");
    setVenueHours("");
    setVenueGenres([]);
    setInviteCode("");
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (mode === "register") {
        if (accountType === "viewer") {
          if (!phone.trim()) {
            setLocalError("Enter your phone number.");
            return;
          }
          setViewerLoading(true);
          try {
            const response = await apiRegister({
              accountType: "viewer",
              email: email.trim(),
              password,
              displayName: name.trim(),
              phone: phone.trim(),
            });
            await setAuth(response.token, response.user);
            const stubOtp = response.otpDebug?.phoneOtp;
            const params = new URLSearchParams();
            if (stubOtp) params.set("stubOtp", stubOtp);
            router.push(`/login/verify-phone${params.toString() ? `?${params}` : ""}`);
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Registration failed");
          } finally {
            setViewerLoading(false);
          }
          return;
        } else if (accountType === "owner") {
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

  const isLoading = accountType === "viewer" ? viewerLoading : loading;
  const displayError = localError || error;

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:py-16">
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
                {accountType === "owner" ? "Venue Owner" : accountType === "promoter" ? "Venue Promoter" : "Viewer"}
              </span>
              <button type="button" onClick={resetForm} className="text-xs text-zinc-500 hover:text-zinc-300">
                Change
              </button>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
                {accountType === "viewer" ? "Display name" : "Name"}
              </label>
              <input
                id="name" type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass} placeholder={accountType === "viewer" ? "Your display name" : "Your name"}
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

          {mode === "register" && accountType === "viewer" && (
            <ViewerFields
              phone={phone} inputClass={inputClass}
              onPhoneChange={setPhone}
            />
          )}

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

          {displayError && <p className="text-sm text-red-400">{displayError}</p>}

          <button
            type="submit" disabled={isLoading}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
