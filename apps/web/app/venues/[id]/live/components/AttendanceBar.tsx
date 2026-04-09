"use client";

import { useAttendance } from "@/hooks/useAttendance";

interface AttendanceBarProps {
  streamId: string;
  initialIntentCount?: number;
  initialArrivalCount?: number;
}

export function AttendanceBar({
  streamId,
  initialIntentCount = 0,
  initialArrivalCount = 0,
}: AttendanceBarProps) {
  const {
    intentPressed, arrivalPressed,
    showThankYou, handleIntent, handleArrival,
  } = useAttendance({ streamId, initialIntentCount, initialArrivalCount });

  return (
    <div className="flex items-center gap-3 bg-black/60 px-4 py-3 backdrop-blur-sm">
      {/* Label */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0 text-white/60">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white leading-tight">Planning to go out?</p>
          <p className="text-xs text-white/50 leading-tight">
            {showThankYou ? "Thank you from VibeCheck!" : "Let others know your vibe"}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-shrink-0 gap-2">
        <button
          onClick={handleIntent}
          disabled={intentPressed}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
            intentPressed
              ? "cursor-default bg-white/10 text-white/40"
              : "bg-zinc-800/90 text-white hover:bg-zinc-700"
          }`}
        >
          <span>🤔</span>
          <span>{intentPressed ? "Thinking ✓" : "Thinking of going"}</span>
        </button>
        <button
          onClick={handleArrival}
          disabled={arrivalPressed}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
            arrivalPressed
              ? "cursor-default bg-brand-red/40 text-white/50"
              : "bg-brand-red text-white hover:opacity-90"
          }`}
        >
          <span>🚶</span>
          <span>{arrivalPressed ? "I'm Here ✓" : "I'm here"}</span>
        </button>
      </div>
    </div>
  );
}
