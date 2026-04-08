"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchMyVenues, useAuthStore, useBroadcastStore, VenueWithStats } from "@vibecheck/shared";
import FeedbackButton from "@/components/FeedbackButton";
import VibecheckIcon from "@/components/VibecheckIcon";

export default function NavBar() {
  const router = useRouter();
  const { user, token, logout, hydrate } = useAuthStore();
  const { venueId, venueName } = useBroadcastStore();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [goLivePickerOpen, setGoLivePickerOpen] = useState(false);
  const [goLiveVenues, setGoLiveVenues] = useState<VenueWithStats[]>([]);
  const [goLiveLoading, setGoLiveLoading] = useState(false);
  const [goLiveError, setGoLiveError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    setMenuOpen(false);
    setGoLivePickerOpen(false);
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

  const loadGoLiveVenues = async () => {
    if (!token) {
      setGoLiveError("You need to be signed in to go live.");
      setGoLiveVenues([]);
      return;
    }
    setGoLiveLoading(true);
    setGoLiveError(null);
    try {
      const venues = await fetchMyVenues(token);
      const sorted = [...venues].sort((a, b) => {
        if (a.isLive !== b.isLive) return Number(b.isLive) - Number(a.isLive);
        return a.name.localeCompare(b.name);
      });
      setGoLiveVenues(sorted);
    } catch (err) {
      setGoLiveError(err instanceof Error ? err.message : "Failed to load your venues.");
      setGoLiveVenues([]);
    } finally {
      setGoLiveLoading(false);
    }
  };

  const openGoLivePicker = () => {
    setGoLivePickerOpen(true);
    void loadGoLiveVenues();
  };

  const handleSelectVenue = (selectedVenueId: string) => {
    setGoLivePickerOpen(false);
    router.push(`/dashboard/live/${selectedVenueId}`);
  };

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
                      <button
                        type="button"
                        onClick={openGoLivePicker}
                        className="rounded-lg bg-brand-red px-3 py-1.5 font-medium text-white transition-colors hover:bg-brand-red/90"
                      >
                        Go Live
                      </button>
                    </>
                  )}
                  {!isAdminRoute && <FeedbackButton />}
                  <Link
                    href="/account"
                    className="whitespace-nowrap rounded-md border border-zinc-700 px-2 py-0.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                  >
                    {user.name}
                  </Link>
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
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openGoLivePicker();
                      }}
                      className="rounded-lg bg-brand-red px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red/90"
                    >
                      Go Live
                    </button>
                  </>
                )}
                <div className="mt-1 flex items-center justify-between border-t border-zinc-800 pt-2">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                  >
                    {user.name}
                  </Link>
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

      {goLivePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Select venue to go live"
          onClick={() => setGoLivePickerOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Broadcast
                </p>
                <h2 className="text-lg font-semibold text-zinc-100">Select a venue</h2>
              </div>
              <button
                type="button"
                onClick={() => setGoLivePickerOpen(false)}
                className="rounded-lg px-2 py-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
                aria-label="Close venue selector"
              >
                ✕
              </button>
            </div>

            {goLiveLoading && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-sm text-zinc-400">
                Loading your venues...
              </div>
            )}

            {!goLiveLoading && goLiveError && (
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-3 text-sm text-red-300">
                {goLiveError}
              </div>
            )}

            {!goLiveLoading && !goLiveError && goLiveVenues.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-sm text-zinc-400">
                No linked venues available for broadcast yet.
              </div>
            )}

            {!goLiveLoading && !goLiveError && goLiveVenues.length > 0 && (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {goLiveVenues.map((venue) => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => handleSelectVenue(venue.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-850"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{venue.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{venue.location}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                        venue.isLive
                          ? "bg-brand-red/20 text-brand-red"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {venue.isLive ? "Live" : "Offline"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
