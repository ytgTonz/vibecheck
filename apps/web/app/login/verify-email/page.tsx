"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail, useAuthStore } from "@vibecheck/shared";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailToken = searchParams.get("token");
  const { setUser } = useAuthStore();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!emailToken) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    let cancelled = false;

    verifyEmail(emailToken)
      .then(({ message: msg, user: updatedUser }) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(msg || "Email verified successfully.");
        if (updatedUser) setUser(updatedUser);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      });

    return () => { cancelled = true; };
  }, [emailToken, setUser]);

  return (
    <div className="mx-auto max-w-sm px-4 py-8 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        &larr; Home
      </Link>

      <h1 className="mb-4 text-2xl font-bold tracking-tight">Email Verification</h1>

      {status === "loading" && (
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
          Verifying your email...
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-3">
            <p className="text-sm text-emerald-300">{message}</p>
          </div>
          <Link
            href="/browse"
            className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Browse venues
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3">
            <p className="text-sm text-red-300">{message}</p>
          </div>
          <Link
            href="/login"
            className="inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500"
          >
            Back to login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
