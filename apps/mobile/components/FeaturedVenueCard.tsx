import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Venue, useVenueStore, venueTypeLabel } from '@vibecheck/shared';
import { PulseDot } from './PulseDot';

export default function FeaturedVenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const liveVenue = useVenueStore((s) =>
    s.venues.find((candidate) => candidate.id === venue.id) as (Venue & { currentViewerCount?: number }) | undefined,
  );
  const resolvedVenue = liveVenue ?? (venue as Venue & { currentViewerCount?: number });
  const isLive = Boolean(resolvedVenue.isLive);
  const viewerCount = isLive ? (resolvedVenue.currentViewerCount ?? 0) : 0;

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
      className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900 active:opacity-90"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 34,
        elevation: 8,
      }}
    >
      <View className="p-6 pt-14">
        {/* Featured label — absolute top left */}
        <View className="absolute left-5 top-5 flex-row items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5">
          <Ionicons name="star" size={10} color="#fbbf24" />
          <Text className="text-[11px] font-semibold text-amber-400">TONIGHT'S PICK</Text>
        </View>

        {/* LIVE badge — absolute top right */}
        {isLive && (
          <View className="absolute right-5 top-5 flex-row items-center gap-1.5 rounded-xl bg-brand-red px-3 py-1.5">
            <PulseDot live />
            <Text className="text-[11px] font-semibold text-white">LIVE</Text>
          </View>
        )}

            <Text className="text-[26px] font-semibold text-zinc-100 leading-tight">{resolvedVenue.name}</Text>
        <Text className="mt-1.5 text-sm text-zinc-400">
          {venueTypeLabel[resolvedVenue.type] ?? resolvedVenue.type} · {resolvedVenue.location}
        </Text>

        <View className="mt-4 flex-row gap-5">
          {isLive && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="eye-outline" size={14} color="#fbbf24" />
              <Text className="text-sm font-semibold text-amber-400">{viewerCount} watching</Text>
            </View>
          )}
          {resolvedVenue.musicGenre.length > 0 && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="musical-notes-outline" size={14} color="#71717a" />
              <Text className="text-sm text-zinc-500">{resolvedVenue.musicGenre[0]}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
