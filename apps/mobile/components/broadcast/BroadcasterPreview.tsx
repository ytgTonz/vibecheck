import { ActivityIndicator, Text, View } from 'react-native';
import {
  isTrackReference,
  TrackSource,
  useTracks,
  VideoTrack,
} from '@/components/live/livekit';

export function BroadcasterPreview() {
  const tracks =
    useTracks?.([TrackSource?.Camera].filter(Boolean), { onlySubscribed: false }) || [];
  const localTrack = tracks.find(
    (track: any) =>
      isTrackReference?.(track) &&
      track.participant?.isLocal &&
      track.source === TrackSource?.Camera,
  );

  if (!localTrack) {
    return (
      <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950">
        <ActivityIndicator color="#f4f4f5" />
        <Text className="mt-3 text-sm text-zinc-400">Camera starting...</Text>
      </View>
    );
  }

  return (
    <VideoTrack
      trackRef={localTrack}
      style={{ width: '100%', height: '100%' }}
      objectFit="cover"
    />
  );
}
