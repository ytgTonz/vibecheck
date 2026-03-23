import { ActivityIndicator, Text, View } from 'react-native';
import { VideoTrack } from './livekit';

export function LiveVideoStage({
  videoTrack,
  width,
  height,
}: {
  videoTrack: any;
  width: number;
  height: number;
}) {
  if (videoTrack) {
    return (
      <VideoTrack
        trackRef={videoTrack}
        style={{ width, height }}
        objectFit="cover"
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950 px-8">
      <View className="w-full max-w-[280px] items-center">
        <View className="mb-5 h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <ActivityIndicator size="small" color="#ef4444" />
        </View>
        <Text className="text-center text-lg font-semibold text-white">
          Waiting for broadcaster
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-zinc-500">
          The room is connected. Video will appear as soon as the host starts streaming.
        </Text>
      </View>
    </View>
  );
}
