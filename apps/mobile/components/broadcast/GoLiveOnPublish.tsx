import { useEffect, useRef } from 'react';
import { goLiveStream } from '@vibecheck/shared';
import { isTrackReference, TrackSource, useTracks } from '@/components/live/livekit';

interface GoLiveOnPublishProps {
  streamId: string;
  authToken: string;
}

export function GoLiveOnPublish({ streamId, authToken }: GoLiveOnPublishProps) {
  const tracks =
    useTracks?.([TrackSource?.Camera].filter(Boolean), { onlySubscribed: false }) || [];
  const firedRef = useRef(false);
  const localTrack = tracks.find(
    (track: any) =>
      isTrackReference?.(track) &&
      track.participant?.isLocal &&
      track.source === TrackSource?.Camera,
  );

  useEffect(() => {
    if (localTrack && !firedRef.current) {
      firedRef.current = true;
      goLiveStream(streamId, authToken).catch((err) => {
        console.error('[MobileBroadcast] go-live failed:', err);
      });
    }
  }, [authToken, localTrack, streamId]);

  return null;
}
