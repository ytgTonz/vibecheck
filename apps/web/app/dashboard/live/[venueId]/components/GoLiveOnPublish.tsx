"use client";

import { useEffect, useRef } from "react";
import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { goLiveStream } from "@vibecheck/shared";

interface GoLiveOnPublishProps {
  streamId: string;
  authToken: string;
}

export function GoLiveOnPublish({ streamId, authToken }: GoLiveOnPublishProps) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const firedRef = useRef(false);

  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  useEffect(() => {
    if (localTrack && !firedRef.current) {
      firedRef.current = true;
      goLiveStream(streamId, authToken).catch(() => {});
    }
  }, [localTrack, streamId, authToken]);

  return null;
}
