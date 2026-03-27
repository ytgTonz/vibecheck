"use client";

import { useRemoteParticipants } from "@livekit/components-react";

export function ViewerCount() {
  const participants = useRemoteParticipants();
  const count = participants.length;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {count} watching
    </span>
  );
}
