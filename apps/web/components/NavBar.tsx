"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, useBroadcastStore } from "@vibecheck/shared";
import FeedbackButton from "@/components/FeedbackButton";
import VibecheckIcon from "@/components/VibecheckIcon";

export default function NavBar() {
  const { user, logout, hydrate } = useAuthStore();
  const { venueId, venueName } = useBroadcastStore();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const update = () => {
      const progress = Math.min(window.scrollY / 56, 1);
      setScrollProgress(progress);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const isOnBroadcastPage = venueId && pathname === `/dashboard/live/${venueId}`;
  const isViewer = user?.role === "VIEWER";
  const isAdmin = user?.role === "ADMIN";
  const isAdminRoute = pathname.startsWith("/admin");
  const canBroadcast = user && !isViewer && !isAdmin;
  const keepCompact = hydrated && Boolean(user);
  const leftLogoVisibility = keepCompact ? 1 : scrollProgress;
  const centeredLogoVisibility = keepCompact ? 0 : 1 - scrollProgress;

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950">
      {venueId && !isOnBroadcastPage && (
        <Link
          href={`/dashboard/live/${venueId}`}
          className="flex items-center justify-center gap-2 bg-brand-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red/90"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          You are live at {venueName} — tap to return to stream
        </Link>
      )}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[auto_1fr_auto] items-center px-4 py-3">
        <div className="flex items-center">
          <Link
            href="/"
            className="rounded-xl outline-none ring-brand-red/40 transition-opacity duration-200 ease-out will-change-transform focus-visible:ring-2 motion-reduce:transition-none"
            aria-label="VibeCheck home"
            style={{
              opacity: leftLogoVisibility,
              transform: `translateX(${(1 - leftLogoVisibility) * -8}px)`,
              pointerEvents: leftLogoVisibility > 0.02 ? "auto" : "none",
            }}
          >
            <VibecheckIcon size={28} className="block" />
          </Link>
        </div>

        <Link
          href="/"
          className="justify-self-center font-bebas text-2xl tracking-widest transition-opacity duration-200 ease-out motion-reduce:transition-none"
          aria-label="VibeCheck home"
          style={{
            opacity: centeredLogoVisibility,
            transform: `translateY(${(1 - centeredLogoVisibility) * -2}px)`,
            pointerEvents: centeredLogoVisibility > 0.02 ? "auto" : "none",
          }}
        >
          <span className="text-zinc-100">VIBE</span>
          <span className="text-brand-red">CHECK</span>
        </Link>

        {hydrated && (
          <div className="flex items-center justify-end">
            {/* Desktop nav */}
            <div className="hidden items-center gap-4 whitespace-nowrap text-sm sm:flex">
              {!isAdminRoute && (
                <Link
                  href="/browse"
                  className="text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  Browse
                </Link>
              )}
              {user ? (
                <>
                  {isAdmin && !isAdminRoute && (
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
                  {!isAdminRoute && <FeedbackButton />}
                  <span className="whitespace-nowrap text-zinc-400">{user.name}</span>
                  <button
                    onClick={logout}
                    className="whitespace-nowrap text-zinc-500 transition-colors hover:text-zinc-300"
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
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && hydrated && (
        <div className="border-t border-zinc-800 px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {!isAdminRoute && (
              <Link
                href="/browse"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              >
                Browse
              </Link>
            )}
            {user ? (
              <>
                {isAdmin && !isAdminRoute && (
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
                {!isAdminRoute && (
                  <div className="border-t border-zinc-800 pt-2">
                    <FeedbackButton />
                  </div>
                )}
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
