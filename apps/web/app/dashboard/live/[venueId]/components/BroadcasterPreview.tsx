"use client";

import { VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

export function BroadcasterPreview() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  if (!localTrack) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-900 rounded-xl">
        <p className="text-sm text-zinc-400">Camera starting...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={localTrack}
      className="h-full w-full rounded-xl object-cover"
    />
  );
}
