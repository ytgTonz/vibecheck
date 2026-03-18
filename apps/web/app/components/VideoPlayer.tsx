"use client";

import { useRef, useState, useCallback, SyntheticEvent, useEffect } from "react";
import ReactPlayer from "react-player";
import { Clip } from "@vibecheck/shared";

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

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({
  clips,
  activeIndex,
  venueName,
  onClose,
  onNavigate,
  onView,
}: {
  clips: Clip[];
  activeIndex: number;
  venueName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onView?: (clipId: string) => void;
}) {
  const clip = clips[activeIndex];
  const viewedClipIds = useRef<Set<string>>(new Set());
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < clips.length - 1;

  useEffect(() => {
    setPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setReady(false);
  }, [clip.id]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" && canGoPrev) {
        onNavigate(activeIndex - 1);
        return;
      }

      if (event.key === "ArrowRight" && canGoNext) {
        onNavigate(activeIndex + 1);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        setPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, canGoNext, canGoPrev, onClose, onNavigate]);

  const handleTimeUpdate = useCallback(
    (e: SyntheticEvent<HTMLVideoElement>) => {
      const nextTime = e.currentTarget.currentTime;
      setCurrentTime(nextTime);

      if (!viewedClipIds.current.has(clip.id) && nextTime > 0 && onView) {
        viewedClipIds.current.add(clip.id);
        onView(clip.id);
      }
    },
    [clip.id, onView]
  );

  const handleLoadedMetadata = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
    setReady(true);
  }, []);

  const handleEnded = useCallback(() => {
    if (canGoNext) {
      onNavigate(activeIndex + 1);
      return;
    }

    setPlaying(false);
  }, [activeIndex, canGoNext, onNavigate]);

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 text-white backdrop-blur-md">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={
          clip.thumbnail
            ? { backgroundImage: `url(${clip.thumbnail})` }
            : undefined
        }
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_36%),linear-gradient(180deg,rgba(5,5,5,0.25),rgba(5,5,5,0.92))]" />

      <div className="relative flex min-h-screen items-center justify-center p-3 sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55 sm:right-6 sm:top-6"
          aria-label="Close viewer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-full max-w-6xl">
          <div className="mb-3 flex items-center gap-3 px-1 sm:mb-4">
            {clips.map((item, index) => {
              const width =
                index < activeIndex
                  ? "100%"
                  : index === activeIndex
                    ? `${progress * 100}%`
                    : "0%";

              return (
                <div key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-200"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-center">
            <div className="order-2 flex flex-col gap-4 px-1 lg:order-1 lg:max-w-md">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-200/90">
                  Live Venue Story
                </p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
                  {venueName}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">
                  Quick, current clips that answer the only question that matters:
                  should you pull up tonight?
                </p>
              </div>

              <div className="space-y-3 rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/95">
                      {clip.caption || "Current room energy"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {timeAgo(clip.createdAt)}
                      {clip.views > 0 ? ` • ${clip.views} views` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">
                    {fmt(duration || clip.duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => onNavigate(activeIndex - 1)}
                    disabled={!canGoPrev}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Prev
                  </button>

                  <button
                    onClick={() => setPlaying((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-orange-100"
                  >
                    {playing ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                    {playing ? "Pause" : "Play"}
                  </button>

                  <button
                    onClick={() => onNavigate(activeIndex + 1)}
                    disabled={!canGoNext}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Clip {activeIndex + 1} of {clips.length}
                  </span>
                  <span>
                    {fmt(currentTime)} / {fmt(duration || clip.duration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                {!ready && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                  </div>
                )}

                <div className="aspect-[9/16]">
                  <ReactPlayer
                    src={clip.videoUrl}
                    playing={playing}
                    controls={false}
                    width="100%"
                    height="100%"
                    onReady={() => setReady(true)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    playsInline
                  />
                </div>

                <button
                  onClick={() => setPlaying((prev) => !prev)}
                  className="absolute inset-0 z-10"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {!playing && (
                    <div className="flex h-full w-full items-center justify-center bg-black/35">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm">
                        <svg className="ml-1 h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>

                <button
                  onClick={() => onNavigate(activeIndex - 1)}
                  disabled={!canGoPrev}
                  className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous clip"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <button
                  onClick={() => onNavigate(activeIndex + 1)}
                  disabled={!canGoNext}
                  className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next clip"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
