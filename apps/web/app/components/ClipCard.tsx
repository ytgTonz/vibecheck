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
}: {
  clip: Clip;
  onPlay: (clip: Clip) => void;
}) {
  return (
    <button
      onClick={() => onPlay(clip)}
      className="group relative w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 aspect-video text-left"
    >
      {/* Thumbnail */}
      {clip.thumbnail ? (
        <img
          src={clip.thumbnail}
          alt={clip.caption || "Clip thumbnail"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
          No thumbnail
        </div>
      )}

      {/* Play icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <svg
          className="h-12 w-12 text-white opacity-70 drop-shadow-lg transition-opacity group-hover:opacity-100"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {/* Duration badge */}
      <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
        {formatDuration(clip.duration)}
      </span>

      {/* Caption + metadata below thumbnail */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
        {clip.caption && (
          <p className="truncate text-sm font-medium text-white">
            {clip.caption}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span>{timeAgo(clip.createdAt)}</span>
          {clip.views > 0 && <span>{clip.views} views</span>}
        </div>
      </div>
    </button>
  );
}
