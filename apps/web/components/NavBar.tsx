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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isOnBroadcastPage = venueId && pathname === `/dashboard/live/${venueId}`;
  const isViewer = user?.role === "VIEWER";
  const isAdmin = user?.role === "ADMIN";
  const canBroadcast = user && !isViewer && !isAdmin;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      {venueId && !isOnBroadcastPage && (
        <Link
          href={`/dashboard/live/${venueId}`}
          className="flex items-center justify-center gap-2 bg-brand-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red/90"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          You are live at {venueName} — tap to return to stream
        </Link>
      )}
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bebas text-2xl tracking-widest">
          <span className="text-zinc-100">VIBE</span><span className="text-brand-red">CHECK</span>
        </Link>

        {hydrated && (
          <>
            {/* Desktop nav */}
            <div className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                href="/browse"
                className="text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Browse
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      Admin
                    </Link>
                  )}
                  {canBroadcast && (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard"
                        className="rounded-lg bg-brand-red px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-red/90"
                      >
                        Go Live
                      </Link>
                    </>
                  )}
                  <FeedbackButton />
                  <span className="text-zinc-400">{user.name}</span>
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

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 sm:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && hydrated && (
        <div className="border-t border-zinc-800 px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            >
              Browse
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    Admin
                  </Link>
                )}
                {canBroadcast && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg bg-brand-red px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red/90"
                    >
                      Go Live
                    </Link>
                  </>
                )}
                <div className="mt-1 flex items-center justify-between border-t border-zinc-800 pt-2">
                  <span className="px-3 text-xs text-zinc-500">{user.name}</span>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                  >
                    Log out
                  </button>
                </div>
                <div className="border-t border-zinc-800 pt-2">
                  <FeedbackButton />
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
