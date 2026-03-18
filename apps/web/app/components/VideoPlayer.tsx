"use client";

import { useRef, useState, useCallback, SyntheticEvent } from "react";
import ReactPlayer from "react-player";
import { Clip } from "@vibecheck/shared";

export default function VideoPlayer({
  clip,
  onClose,
  onView,
}: {
  clip: Clip;
  onClose: () => void;
  onView?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ready, setReady] = useState(false);
  const viewRecorded = useRef(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  const handleTimeUpdate = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);

    // Record a view on first actual playback (time > 0 means media is playing)
    if (!viewRecorded.current && e.currentTarget.currentTime > 0 && onView) {
      viewRecorded.current = true;
      onView();
    }
  }, [onView]);

  const handleLoadedMetadata = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    setDuration(e.currentTarget.duration);
    setReady(true);
  }, []);

  /** Format seconds as m:ss. */
  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-xl bg-black"
    >
      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
        </div>
      )}

      {/* Player */}
      <div className="aspect-video">
        <ReactPlayer
          src={clip.videoUrl}
          playing={playing}
          controls={false}
          width="100%"
          height="100%"
          onReady={() => setReady(true)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          playsInline
        />
      </div>

      {/* Click-to-play/pause overlay */}
      <button
        onClick={() => setPlaying((p) => !p)}
        className="absolute inset-0 z-10"
        aria-label={playing ? "Pause" : "Play"}
      >
        {/* Show play icon when paused */}
        {!playing && (
          <div className="flex h-full w-full items-center justify-center bg-black/30">
            <svg
              className="h-16 w-16 text-white drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </button>

      {/* Bottom control bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
        {/* Progress bar */}
        <div className="mb-2 h-1 w-full cursor-pointer rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => setPlaying((p) => !p)}
              className="text-white hover:text-zinc-300"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Time */}
            <span className="text-xs text-zinc-300">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-zinc-300"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="text-white hover:text-zinc-300"
              aria-label="Close player"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Caption */}
        {clip.caption && (
          <p className="mt-1 text-sm text-zinc-300">{clip.caption}</p>
        )}
      </div>
    </div>
  );
}
