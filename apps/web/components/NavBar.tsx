"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, useBroadcastStore } from "@vibecheck/shared";
import FeedbackButton from "@/components/FeedbackButton";

export default function NavBar() {
  const { user, logout, hydrate } = useAuthStore();
  const { venueId, venueName } = useBroadcastStore();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  const isOnBroadcastPage = venueId && pathname === `/dashboard/live/${venueId}`;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      {venueId && !isOnBroadcastPage && (
        <Link
          href={`/dashboard/live/${venueId}`}
          className="flex items-center justify-center gap-2 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          You are live at {venueName} — tap to return to stream
        </Link>
      )}
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
