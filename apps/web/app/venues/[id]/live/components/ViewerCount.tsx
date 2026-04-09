"use client";

import { useRemoteParticipants } from "@livekit/components-react";

function formatCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return String(count);
}

export function ViewerCount() {
  const participants = useRemoteParticipants();
  const count = participants.length;
  return (
    <span className="text-xs text-white/70">
      {formatCount(count)} watching
    </span>
  );
}
