import Link from "next/link";
import { Venue, venueTypeLabel } from "@vibecheck/shared";

export default function VenueCard({ venue }: { venue: Venue }) {
  const status = venue.isLive
    ? { label: "Live", detail: "Watch now" }
    : { label: "Offline", detail: venue.hours ?? "Check back later" };
  const href = venue.isLive
    ? `/venues/${venue.id}/live`
    : `/venues/${venue.id}`;

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[1.75rem] border bg-zinc-950 p-5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${venue.isLive ? "border-brand-red/40 hover:border-brand-red/60" : "border-zinc-800 hover:border-zinc-700"}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,12,0.12),rgba(10,10,12,0.92))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/8" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  venue.isLive ? "animate-pulse bg-brand-red" : "bg-zinc-500"
                }`}
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
                {status.label}
              </p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight">
              {venue.name}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-100/90">
            {venueTypeLabel[venue.type] ?? venue.type}
          </span>
        </div>

        <p className="mb-4 max-w-xs text-sm leading-6 text-zinc-300">
          {venue.location}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-100/90">
            {status.detail}
          </span>
          {venue.hours && !venue.isLive && (
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-100/90">
              {venue.hours}
            </span>
          )}
        </div>

        {venue.musicGenre.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {venue.musicGenre.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/8 bg-transparent px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-200"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-zinc-200/85">
            {venue.isLive ? "Watch live" : "View venue"}
          </span>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-transform duration-300 group-hover:scale-105">
            {venue.isLive ? (
              <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
