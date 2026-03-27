import Link from "next/link";
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

export default function FeaturedVenueCard({ venue }: { venue: Venue }) {
  const status = venue.isLive ? "Live" : "Offline";
  const href = venue.isLive ? `/venues/${venue.id}/live` : `/venues/${venue.id}`;

  return (
    <Link
      href={href}
      className={`group relative block w-full overflow-hidden rounded-[1.75rem] border bg-zinc-950 text-white shadow-[0_18px_48px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${venue.isLive ? "border-red-500/40 hover:border-red-500/60" : "border-zinc-800 hover:border-zinc-700"}`}
    >
      <div className="flex flex-col p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              venue.isLive ? "animate-pulse bg-red-500" : "bg-zinc-500"
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

        <div className="mt-4 flex items-center gap-4">
          <span className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform duration-300 group-hover:scale-105 ${venue.isLive ? "bg-red-500 text-white" : "bg-white text-zinc-900"}`}>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {venue.isLive ? "Watch live" : "View venue"}
          </span>
        </div>
      </div>
    </Link>
  );
}
