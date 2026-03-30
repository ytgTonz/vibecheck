import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Venue } from '@vibecheck/shared';

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

export function LiveHeader({
  venue,
  viewerCount,
  peakCount: _peakCount,
}: {
  venue: Venue;
  viewerCount: number;
  peakCount?: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute left-0 right-0 top-0 z-10"
      style={{ paddingTop: Math.max(insets.top, 8) }}
    >
      <View className="flex-row items-center justify-between px-4">
        {/* Left: LIVE badge + viewer count */}
        <View className="flex-row items-center gap-2">
          <View className="rounded-md bg-brand-red px-2.5 py-1">
            <Text className="text-xs font-bold text-white">LIVE</Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-md bg-black/50 px-2.5 py-1">
            <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text className="text-xs font-semibold text-white">
              {compactNumber(viewerCount)}
            </Text>
          </View>
        </View>

        {/* Right: close button */}
        <Pressable
          onPress={() => router.replace({ pathname: '/venues/[id]', params: { id: venue.id } })}
          className="rounded-full bg-black/50 px-4 py-1.5"
        >
          <Text className="text-sm font-semibold text-white">Close</Text>
        </Pressable>
      </View>

      {/* Venue name — subtle, below the badges */}
      <View className="mt-2 px-4">
        <Text className="text-sm font-semibold text-white" numberOfLines={1}>
          {venue.name}
        </Text>
        <Text className="text-xs text-white/50" numberOfLines={1}>
          {venue.location}
        </Text>
      </View>
    </View>
  );
}
