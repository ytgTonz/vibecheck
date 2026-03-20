"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@vibecheck/shared";
import FeedbackButton from "./FeedbackButton";

export default function NavBar() {
  const { user, logout, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          VibeCheck
        </Link>

        {hydrated && (
          <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-4">
            <Link
              href="/browse"
              className="text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Browse
            </Link>
            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/upload"
                      className="rounded-lg bg-white px-3 py-1.5 font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                    >
                      Upload
                    </Link>
                    <Link
                      href="/dashboard"
                      className="rounded-lg bg-red-500 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Go Live
                    </Link>
                  </>
                )}
                <FeedbackButton />
                <span className="hidden text-zinc-400 sm:inline">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Log in
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
