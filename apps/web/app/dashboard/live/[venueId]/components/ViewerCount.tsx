"use client";

import { useEffect } from "react";
import { useRemoteParticipants } from "@livekit/components-react";

interface Props {
  onCountChange?: (count: number) => void;
}

export function ViewerCount({ onCountChange }: Props) {
  const participants = useRemoteParticipants();
  const count = participants.length;

  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
      </svg>
      {count} viewer{count !== 1 ? "s" : ""}
    </span>
  );
}
