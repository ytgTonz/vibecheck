/**
 * Shared attendance logic used by both AttendanceCard (venue detail page)
 * and AttendanceBar (live stream overlay). Extracted here so changes to
 * attendance behaviour only need to happen in one place.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AttendanceUpdateEvent,
  useAuthStore,
  useSocket,
  recordAttendanceIntent,
  recordAttendanceArrival,
} from "@vibecheck/shared";
import { getDeviceId } from "@/lib/deviceId";

const intentKey = (id: string) => `attendance_intent_${id}`;
const arrivalKey = (id: string) => `attendance_arrival_${id}`;

interface UseAttendanceOptions {
  streamId: string;
  initialIntentCount?: number;
  initialArrivalCount?: number;
}

export function useAttendance({
  streamId,
  initialIntentCount = 0,
  initialArrivalCount = 0,
}: UseAttendanceOptions) {
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

  return {
    intentPressed,
    arrivalPressed,
    intentCount,
    arrivalCount,
    showThankYou,
    handleIntent,
    handleArrival,
  };
}
