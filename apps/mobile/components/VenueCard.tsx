import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Venue, venueTypeLabel } from '@vibecheck/shared';

export default function VenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const isLive = Boolean(venue.isLive);
  const viewerCount = isLive ? ((venue as any).currentViewerCount ?? 0) : null;

  return (
    <Pressable
      onPress={() =>
        router.push(
          isLive
            ? { pathname: '/venues/[id]/live', params: { id: venue.id } }
            : { pathname: '/venues/[id]', params: { id: venue.id } }
        )
      }
      android_ripple={{ color: 'rgba(255,255,255,0.07)', borderless: false }}
      className="mb-3 bg-zinc-900 border border-zinc-800 rounded-[20px] px-5 py-4 flex-row justify-between items-center active:opacity-80"
    >
      <View className="flex-1 pr-4">
        <Text className="text-base font-semibold text-zinc-100">{venue.name}</Text>
        <Text className="text-[13px] text-zinc-500 mt-1">
          {venueTypeLabel[venue.type] ?? venue.type} · {venue.location}
        </Text>
      </View>

      {isLive && (
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-green-500" style={styles.greenDot} />
          <Text className="text-sm font-semibold text-green-500">{viewerCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greenDot: {
    shadowColor: '#22c55e',
    shadowRadius: 8,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  },
});
