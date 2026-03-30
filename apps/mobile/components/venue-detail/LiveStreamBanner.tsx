import { Pressable, Text, View } from 'react-native';
import { LiveStream } from '@vibecheck/shared';

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

interface LiveStreamBannerProps {
  activeStream: LiveStream | null;
  onPress: () => void;
}

export function LiveStreamBanner({ activeStream, onPress }: LiveStreamBannerProps) {
  const viewerCount = activeStream ? compactNumber(activeStream.currentViewerCount) : null;

  return (
    <Pressable
      onPress={onPress}
      className="mb-5 rounded-[24px] bg-brand-red p-4 flex-row justify-between items-center active:opacity-90"
    >
      <View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-white" />
          <Text className="text-sm font-semibold text-white">Live now</Text>
        </View>
        {viewerCount != null && (
          <Text className="text-xs text-white/80 mt-0.5">{viewerCount} people watching</Text>
        )}
      </View>

      <View className="bg-white rounded-2xl px-4 py-2">
        <Text className="text-xs font-semibold text-brand-red">Watch →</Text>
      </View>
    </Pressable>
  );
}
