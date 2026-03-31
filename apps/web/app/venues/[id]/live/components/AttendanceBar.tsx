"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AttendanceUpdateEvent,
  useAuthStore,
  useSocket,
  recordAttendanceIntent,
  recordAttendanceArrival,
} from "@vibecheck/shared";
import { getDeviceId } from "@/lib/deviceId";

interface AttendanceBarProps {
  streamId: string;
  initialIntentCount?: number;
  initialArrivalCount?: number;
}

const intentKey = (id: string) => `attendance_intent_${id}`;
const arrivalKey = (id: string) => `attendance_arrival_${id}`;

export function AttendanceBar({
  streamId,
  initialIntentCount = 0,
  initialArrivalCount = 0,
}: AttendanceBarProps) {
  const token = useAuthStore((s) => s.token) ?? undefined;
  const [intentPressed, setIntentPressed] = useState(false);
  const [arrivalPressed, setArrivalPressed] = useState(false);
  const [intentCount, setIntentCount] = useState(initialIntentCount);
  const [arrivalCount, setArrivalCount] = useState(initialArrivalCount);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    setIntentPressed(!!localStorage.getItem(intentKey(streamId)));
    setArrivalPressed(!!localStorage.getItem(arrivalKey(streamId)));
  }, [streamId]);

  useSocket({
    "attendance:update": useCallback(
      (data: AttendanceUpdateEvent) => {
        if (data.streamId === streamId) {
          setIntentCount(data.intentCount);
          setArrivalCount(data.arrivalCount);
        }
      },
      [streamId],
    ),
  });

  const handleIntent = async () => {
    if (intentPressed) return;
    setIntentPressed(true);
    localStorage.setItem(intentKey(streamId), "1");
    try {
      const result = await recordAttendanceIntent(streamId, getDeviceId(), token);
      setIntentCount(result.intentCount);
      setArrivalCount(result.arrivalCount);
    } catch {
      // socket will correct counts
    }
  };

  const handleArrival = async () => {
    if (arrivalPressed) return;
    setArrivalPressed(true);
    localStorage.setItem(arrivalKey(streamId), "1");
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 3000);
    try {
      const result = await recordAttendanceArrival(streamId, getDeviceId(), token);
      setIntentCount(result.intentCount);
      setArrivalCount(result.arrivalCount);
    } catch {
      // socket will correct counts
    }
  };

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
