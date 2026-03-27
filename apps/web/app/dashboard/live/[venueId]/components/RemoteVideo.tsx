"use client";

import { VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

export function RemoteVideo() {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true }
  );

  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  );

  if (!videoTrack) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-900 rounded-xl">
        <p className="text-sm text-zinc-400">Waiting for broadcaster...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      className="h-full w-full rounded-xl object-cover"
    />
  );
}
