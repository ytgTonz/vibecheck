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

  console.log('[GoLive] useTracks result:', tracks.length, tracks.map(t => ({ source: t.source, isLocal: t.participant.isLocal, sid: t.publication?.trackSid })));

  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  useEffect(() => {
    if (localTrack && !firedRef.current) {
      firedRef.current = true;
      console.log('[GoLive] localTrack detected, firing go-live for stream:', streamId);
      goLiveStream(streamId, authToken)
        .then(() => console.log('[GoLive] go-live succeeded'))
        .catch((err) => console.error("go-live failed:", err));
    }
  }, [localTrack, streamId, authToken]);

  return null;
}
