import Link from "next/link";
import Image from "next/image";
import { Venue } from "@vibecheck/shared";

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: "Nightclub",
  BAR: "Bar",
  RESTAURANT_BAR: "Restaurant & Bar",
  LOUNGE: "Lounge",
  SHISA_NYAMA: "Shisa Nyama",
  ROOFTOP: "Rooftop",
  OTHER: "Other",
};

function storyStatusLabel(lastClipAt: string | null): string {
  if (!lastClipAt) return "Quiet feed";
  const hours = (Date.now() - new Date(lastClipAt).getTime()) / (1000 * 60 * 60);
  if (hours < 2) return "Live now";
  if (hours < 24) return "Fresh clip";
  return "Catch up";
}

export default function FeaturedVenueCard({ venue }: { venue: Venue }) {
  const status = storyStatusLabel(venue.lastClipAt);
  const hasThumbnail = !!venue.latestClipThumbnail;

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group relative block w-full overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-950 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
    >
      {hasThumbnail && (
        <Image
          src={venue.latestClipThumbnail!}
          alt=""
          fill
          className="object-cover blur-sm"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
        />
      )}
      <div
        className={`absolute inset-0 ${
          hasThumbnail
            ? "bg-gradient-to-t from-black/95 via-black/65 to-black/35"
            : "bg-[linear-gradient(180deg,rgba(10,10,12,0.12),rgba(10,10,12,0.92))]"
        }`}
      />

      <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[320px] sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === "Live now"
                ? "animate-pulse bg-green-400"
                : status === "Fresh clip"
                  ? "bg-amber-400"
                  : "bg-zinc-500"
            }`}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
            {status}
          </span>
          <span className="ml-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-0.5 text-xs font-medium text-zinc-100/90">
            {venueTypeLabel[venue.type] ?? venue.type}
          </span>
        </div>

        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {venue.name}
        </h2>

        <p className="mt-2 text-sm text-zinc-300">{venue.location}</p>

        {venue.latestClipCaption && (
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
            &ldquo;{venue.latestClipCaption}&rdquo;
          </p>
        )}

        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-transform duration-300 group-hover:scale-105">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch now
          </span>
          {venue.latestClipViews != null && venue.latestClipViews > 0 && (
            <span className="text-xs text-zinc-400">
              {venue.latestClipViews.toLocaleString()} views
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
