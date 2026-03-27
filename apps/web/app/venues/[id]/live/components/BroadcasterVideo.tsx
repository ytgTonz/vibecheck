"use client";

import { VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";

export function BroadcasterVideo() {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone],
    { onlySubscribed: true }
  );

  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  );

  if (!videoTrack) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <p className="text-sm text-zinc-400">Waiting for broadcaster...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      className="h-full w-full object-cover"
    />
  );
}
