import { Pressable, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Venue } from '@vibecheck/shared';
import { compactNumber } from '@/lib/format';

export function LiveHeader({
  venue,
  viewerCount,
}: {
  venue: Venue;
  viewerCount: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleShare = async () => {
    try {
      await Share.share({
        title: venue.name,
        message: `Watch ${venue.name} live on VibeCheck`,
      });
    } catch {
      // user cancelled or share not available
    }
  };

  const handleClose = () => {
    router.replace({ pathname: '/venues/[id]', params: { id: venue.id } });
  };

  return (
    <View
      className="absolute left-0 right-0 top-0 z-10 px-4"
      style={{ paddingTop: Math.max(insets.top, 8) }}
    >
      {/* Row 1: back (left) + share + close (right) */}
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
        >
          <Ionicons name="chevron-down" size={22} color="white" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleShare}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
          >
            <Ionicons name="share-outline" size={20} color="white" />
          </Pressable>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
          >
            <Ionicons name="close" size={20} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Row 2: LIVE pill + venue name + verified badge + viewer count */}
      <View className="mt-2 flex-row items-center gap-2">
        {/* LIVE pill */}
        <View className="flex-row items-center gap-1.5 rounded-full bg-brand-red px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-white opacity-90" />
          <Text className="text-xs font-bold text-white">LIVE</Text>
        </View>

        {/* Venue info */}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              {venue.name}
            </Text>
            {/* Verified badge */}
            <View className="h-4 w-4 items-center justify-center rounded-full bg-brand-red">
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          </View>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.6)" />
            <Text className="text-xs text-white/60">
              {compactNumber(viewerCount)} watching
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
