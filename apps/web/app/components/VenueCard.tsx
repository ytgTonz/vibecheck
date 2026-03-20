import Link from "next/link";
import Image from "next/image";
import { Venue } from "@vibecheck/shared";

/** Format an ISO date string as a relative "time ago" label. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Human-readable labels for venue types. */
const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: "Nightclub",
  BAR: "Bar",
  RESTAURANT_BAR: "Restaurant & Bar",
  LOUNGE: "Lounge",
  SHISA_NYAMA: "Shisa Nyama",
  ROOFTOP: "Rooftop",
  OTHER: "Other",
};

const venueTypeTheme: Record<string, string> = {
  NIGHTCLUB:
    "bg-fuchsia-400/75",
  BAR:
    "bg-amber-400/75",
  RESTAURANT_BAR:
    "bg-orange-300/75",
  LOUNGE:
    "bg-cyan-400/75",
  SHISA_NYAMA:
    "bg-red-400/75",
  ROOFTOP:
    "bg-sky-400/75",
  OTHER:
    "bg-zinc-400/75",
};

function storyStatus(lastClipAt: string | null) {
  if (!lastClipAt) {
    return {
      label: "Quiet feed",
      detail: "No recent clip yet",
    };
  }

  const diffMs = Date.now() - new Date(lastClipAt).getTime();
  const hours = diffMs / (1000 * 60 * 60);

  if (hours < 2) {
    return {
      label: "Live now",
      detail: `Updated ${timeAgo(lastClipAt)}`,
    };
  }

  if (hours < 24) {
    return {
      label: "Fresh clip",
      detail: `Updated ${timeAgo(lastClipAt)}`,
    };
  }

  return {
    label: "Catch up",
    detail: `Last clip ${timeAgo(lastClipAt)}`,
  };
}

export default function VenueCard({ venue }: { venue: Venue }) {
  const status = venue.isLive
    ? { label: "Streaming live", detail: "Watch now" }
    : storyStatus(venue.lastClipAt);
  const theme = venue.isLive
    ? "animate-pulse bg-red-500"
    : (venueTypeTheme[venue.type] ?? venueTypeTheme.OTHER);
  const storyBarCount =
    venue.clipCount > 0 ? Math.min(venue.clipCount, 5) : 1;
  const hasThumbnail = !!venue.latestClipThumbnail;
  const href = venue.isLive
    ? `/venues/${venue.id}/live`
    : `/venues/${venue.id}`;

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden rounded-[1.75rem] border bg-zinc-950 p-5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${venue.isLive ? "border-red-500/40 hover:border-red-500/60" : "border-zinc-800 hover:border-zinc-700"}`}
    >
      {hasThumbnail && (
        <Image
          src={venue.latestClipThumbnail!}
          alt=""
          fill
          className="object-cover blur-sm"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      )}
      <div
        className={`absolute inset-0 ${
          hasThumbnail
            ? "bg-gradient-to-t from-black/95 via-black/70 to-black/40"
            : "bg-[linear-gradient(180deg,rgba(10,10,12,0.12),rgba(10,10,12,0.92))]"
        }`}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-white/8" />

      <div className="relative">
        <div className="mb-5 flex gap-1.5">
          {Array.from({ length: storyBarCount }).map((_, bar) => (
            <span
              key={bar}
              className={`h-1 flex-1 rounded-full ${
                venue.clipCount === 0
                  ? "bg-white/12"
                  : bar === 0
                    ? "bg-white/85"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${theme}`} />
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
          {venue.hours && (
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
            {venue.isLive ? "Watch live" : "Open venue story"}
          </span>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition-transform duration-300 group-hover:scale-105">
            <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
