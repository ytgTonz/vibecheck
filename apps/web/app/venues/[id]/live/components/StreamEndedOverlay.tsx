"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

interface StreamEndedOverlayProps {
  venueName: string;
}

export function StreamEndedOverlay({ venueName }: StreamEndedOverlayProps) {
  const room = useRoomContext();
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const handler = () => setEnded(true);
    room.on(RoomEvent.Disconnected, handler);
    return () => { room.off(RoomEvent.Disconnected, handler); };
  }, [room]);

  if (!ended) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-xl font-semibold text-white">Stream ended</p>
        <p className="mt-2 text-sm text-zinc-400">{venueName} has ended their live stream</p>
        <Link
          href="/browse"
          className="mt-4 inline-block rounded-full bg-white px-6 py-2 text-sm font-medium text-zinc-900"
        >
          Back to browse
        </Link>
      </div>
    </div>
  );
}
