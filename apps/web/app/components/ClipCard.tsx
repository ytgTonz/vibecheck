import Image from "next/image";
import { Clip } from "@vibecheck/shared";

/** Format seconds as m:ss (e.g. 30 → "0:30", 95 → "1:35"). */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

export default function ClipCard({
  clip,
  onPlay,
  featured = false,
}: {
  clip: Clip;
  onPlay: (clip: Clip) => void;
  featured?: boolean;
}) {
  return (
    <button
      onClick={() => onPlay(clip)}
      className={`group relative shrink-0 overflow-hidden rounded-[1.75rem] border text-left transition-all duration-300 ${
        featured
          ? "h-[28rem] w-full border-orange-300/30 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:h-[32rem]"
          : "h-72 w-56 border-white/10 bg-zinc-950 hover:-translate-y-1 hover:border-orange-200/30 hover:shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:h-80 sm:w-60"
      }`}
    >
      {/* Thumbnail */}
      {clip.thumbnail ? (
        <Image
          src={clip.thumbnail}
          alt={clip.caption || "Clip thumbnail"}
          fill
          sizes={featured ? "(max-width: 640px) 100vw, 28rem" : "15rem"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
          No thumbnail
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/85" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur-sm">
          {featured ? "Latest Vibe" : "Story"}
        </span>
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {formatDuration(clip.duration)}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-orange-100/85">
          <span>{timeAgo(clip.createdAt)}</span>
          {clip.views > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-white/60" />
              <span>{clip.views} views</span>
            </>
          )}
        </div>

        <p
          className={`max-w-[18rem] text-white ${
            featured
              ? "text-xl font-semibold leading-tight sm:text-2xl"
              : "text-base font-semibold leading-snug"
          }`}
        >
          {clip.caption || "See what the room feels like right now"}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-zinc-200/80">
            {featured ? "Open full viewer" : "Tap to watch"}
          </span>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
            <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}
