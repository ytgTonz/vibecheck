import { Pressable, Text, View } from 'react-native';
import { LiveStream } from '@vibecheck/shared';

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

function liveSinceLabel(iso: string | null) {
  if (!iso) return 'Started moments ago';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `Started ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Started ${hours}h ago`;
  return `Started ${new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

interface LiveStreamBannerProps {
  activeStream: LiveStream | null;
  onPress: () => void;
}

export function LiveStreamBanner({ activeStream, onPress }: LiveStreamBannerProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 overflow-hidden rounded-[28px] border border-red-500/30 bg-zinc-950"
    >
      <View className="absolute inset-0 bg-red-500/10" />
      <View className="px-5 py-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2 rounded-full bg-red-500 px-3 py-1.5">
            <View className="h-2.5 w-2.5 rounded-full bg-white" />
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
              Live
            </Text>
          </View>
          <Text className="text-sm font-medium text-red-200">
            {activeStream
              ? `${compactNumber(activeStream.currentViewerCount)} watching`
              : 'Join now'}
          </Text>
        </View>

        <Text className="mt-5 text-3xl font-semibold text-zinc-100">Watch the room live.</Text>
        <Text className="mt-3 text-sm leading-6 text-zinc-300">
          See the floor, crowd energy, and current vibe in real time.
        </Text>

        <View className="mt-5 flex-row flex-wrap gap-2">
          <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <Text className="text-sm text-zinc-100">
              {activeStream ? liveSinceLabel(activeStream.startedAt) : 'Live right now'}
            </Text>
          </View>
          {activeStream ? (
            <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Text className="text-sm text-zinc-100">
                Peak {compactNumber(activeStream.viewerPeak)}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-6 flex-row items-center justify-between gap-4">
          <Text className="flex-1 text-sm text-zinc-400">
            Open the full-screen live view with chat.
          </Text>
          <View className="rounded-full bg-red-500 px-5 py-3">
            <Text className="text-sm font-semibold text-white">Watch live</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
