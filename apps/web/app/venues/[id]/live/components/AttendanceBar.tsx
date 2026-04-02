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
    intentCount, arrivalCount,
    showThankYou, handleIntent, handleArrival,
  } = useAttendance({ streamId, initialIntentCount, initialArrivalCount });

  return (
    <div className="hidden sm:flex sm:absolute sm:bottom-6 sm:left-1/2 sm:z-10 sm:-translate-x-1/2 flex-col items-center gap-2">
      {showThankYou && (
        <p className="text-xs font-medium text-white/70">
          Thank you from VibeCheck!
        </p>
      )}

      {/* Live counts pill */}
      <div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-1 backdrop-blur-sm">
        <span className="text-xs font-semibold text-white">{intentCount}</span>
        <span className="text-xs text-white/50">coming</span>
        <span className="text-white/30">·</span>
        <span className="text-xs font-semibold text-white">{arrivalCount}</span>
        <span className="text-xs text-white/50">here</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleIntent}
          disabled={intentPressed}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            intentPressed
              ? "cursor-default bg-white/15 text-white/40"
              : "border border-white/30 bg-white/90 text-zinc-900 hover:bg-white"
          }`}
        >
          {intentPressed ? "I'm Coming ✓" : "I'm Coming"}
        </button>
        <button
          onClick={handleArrival}
          disabled={arrivalPressed}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            arrivalPressed
              ? "cursor-default bg-purple-500/40 text-white/50"
              : "bg-purple-500 text-white hover:bg-purple-400"
          }`}
        >
          {arrivalPressed ? "I'm Here ✓" : "I'm Here"}
        </button>
      </div>
    </div>
  );
}
