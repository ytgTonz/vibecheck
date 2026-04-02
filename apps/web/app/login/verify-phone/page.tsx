"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPhone, useAuthStore } from "@vibecheck/shared";

function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stubOtp = searchParams.get("stubOtp");
  const { token, setUser, user, hydrated, hydrate } = useAuthStore();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) inputRef.current?.focus();
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    if (!token) {
      setError("Session expired. Please sign in again.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const { user: updatedUser } = await verifyPhone(otp, token);
      setUser(updatedUser);
      router.push("/browse");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated || !token) return null;

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:py-16">
      <button
        onClick={() => router.back()}
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        &larr; Back
      </button>

      <h1 className="mb-2 text-2xl font-bold tracking-tight">Verify your number</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Enter the 6-digit code sent to your phone.
      </p>

      {stubOtp && (
        <div className="mb-4 rounded-lg border border-amber-700 bg-amber-950 px-4 py-3">
          <p className="text-xs font-medium text-amber-400">Dev stub — SMS not wired</p>
          <p className="mt-1 text-sm text-amber-200">
            Your OTP: <span className="font-mono font-bold">{stubOtp}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-center font-mono text-2xl tracking-widest text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {user && !user.emailVerified && (
        <p className="mt-6 text-center text-xs text-zinc-500">
          Check your email for a verification link too.
        </p>
      )}
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={null}>
      <VerifyPhoneForm />
    </Suspense>
  );
}
