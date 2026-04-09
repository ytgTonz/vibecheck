"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  {
    src: "/marketing/placeholders/hero-venue-stream.png",
    alt: "VibeCheck browse screen showing live venues near you",
    label: "Discover",
    caption: "Browse live venues tonight",
  },
  {
    src: "/marketing/placeholders/viewe-screen-screenshot.png",
    alt: "VibeCheck viewer screen watching a live nightclub stream",
    label: "Watch",
    caption: "Watch before you pull up",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (idx: number) => {
      if (animating || idx === current) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 220);
    },
    [animating, current],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      go((current + 1) % slides.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [current, go]);

  return (
    <div className="relative flex w-full max-w-[340px] flex-col items-center gap-4">
      {/* glow halo behind the frame */}
      <div className="pointer-events-none absolute -inset-6 rounded-[2.8rem] bg-gradient-to-b from-brand-red/25 via-purple-600/15 to-transparent blur-3xl" />

      {/* phone shell — fixed aspect ratio so the outer card never resizes */}
      <div className="relative w-full overflow-hidden rounded-[2.4rem] border border-white/15 bg-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.07)]" style={{ aspectRatio: "9/19.5" }}>
        {/* notch bar */}
        <div className="absolute left-1/2 top-2.5 z-20 h-1.5 w-[76px] -translate-x-1/2 rounded-full bg-zinc-700/80" />

        {/* slide — fills the fixed container, never changes its size */}
        <div
          className="absolute inset-0 transition-opacity duration-200 ease-out"
          style={{ opacity: animating ? 0 : 1 }}
        >
          <Image
            key={slides[current].src}
            src={slides[current].src}
            alt={slides[current].alt}
            fill
            priority
            className="object-cover object-top"
          />
        </div>

        {/* bottom caption bar */}
        <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/45 bg-brand-red/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-red" />
                </span>
                Live
              </span>
              <p className="mt-1.5 text-sm font-semibold text-zinc-100">
                {slides[current].caption}
              </p>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200 backdrop-blur-sm">
              {slides[current].label}
            </span>
          </div>
        </div>
      </div>

      {/* pip indicators + arrows */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => go((current - 1 + slides.length) % slides.length)}
          aria-label="Previous screen"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-5 h-2 bg-brand-red"
                  : "w-2 h-2 bg-zinc-600 hover:bg-zinc-500"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go((current + 1) % slides.length)}
          aria-label="Next screen"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
