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

interface AttendanceCardProps {
  streamId: string;
  initialIntentCount?: number;
  initialArrivalCount?: number;
}

const intentKey = (id: string) => `attendance_intent_${id}`;
const arrivalKey = (id: string) => `attendance_arrival_${id}`;

export function AttendanceCard({
  streamId,
  initialIntentCount = 0,
  initialArrivalCount = 0,
}: AttendanceCardProps) {
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
    <section className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-6">
      <p className="mb-5 text-sm text-zinc-400">Let the venue know you&apos;re coming</p>

      {showThankYou && (
        <p className="mb-4 text-center text-xs font-medium text-zinc-400">
          Thank you from VibeCheck!
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Intent button */}
        <button
          onClick={handleIntent}
          disabled={intentPressed}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
            intentPressed
              ? "cursor-default border-emerald-700/50 bg-emerald-600/20"
              : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700/80"
          }`}
        >
          {/* Calendar icon */}
          <svg
            className={`h-5 w-5 ${intentPressed ? "text-emerald-400" : "text-zinc-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span
            className={`text-center text-xs leading-tight ${
              intentPressed ? "font-medium text-emerald-300" : "text-zinc-400"
            }`}
          >
            I&apos;m thinking
            <br />
            about it
          </span>
          <span className={`text-xs ${intentPressed ? "text-emerald-400" : "text-zinc-500"}`}>
            {intentCount}
          </span>
        </button>

        {/* Arrival button */}
        <button
          onClick={handleArrival}
          disabled={arrivalPressed}
          className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors ${
            arrivalPressed
              ? "cursor-default border-zinc-600 bg-zinc-700/50"
              : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-700/80"
          }`}
        >
          {/* Location pin icon */}
          <svg
            className={`h-5 w-5 ${arrivalPressed ? "text-zinc-300" : "text-zinc-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span
            className={`text-center text-xs leading-tight ${
              arrivalPressed ? "font-medium text-zinc-300" : "text-zinc-400"
            }`}
          >
            I&apos;ve arrived!
          </span>
          <span className={`text-xs ${arrivalPressed ? "text-zinc-300" : "text-zinc-500"}`}>
            {arrivalCount}
          </span>
        </button>
      </div>
    </section>
  );
}
