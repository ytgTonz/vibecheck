import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Venue } from '@vibecheck/shared';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

export default function FeaturedVenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const isLive = venue.isLive;

  return (
    <Pressable
      onPress={() =>
        router.push(
          isLive
            ? { pathname: '/venues/[id]/live', params: { id: venue.id } }
            : { pathname: '/venues/[id]', params: { id: venue.id } }
        )
      }
      className={`overflow-hidden rounded-[28px] border bg-zinc-950 active:opacity-90 ${isLive ? 'border-red-500/40' : 'border-zinc-800'}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 18 },
        shadowRadius: 34,
        elevation: 8,
      }}
    >
      <View className="min-h-[260px] justify-end p-5">
        <View className="mb-4 flex-row flex-wrap items-center gap-2">
          <View
            className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-red-500' : 'bg-zinc-500'}`}
          />
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-300">
            {isLive ? 'Live' : 'Offline'}
          </Text>
          <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
            <Text className="text-xs font-medium text-zinc-300">
              {venueTypeLabel[venue.type] ?? venue.type}
            </Text>
          </View>
        </View>

        <Text className="text-3xl font-semibold text-zinc-100">
          {venue.name}
        </Text>
        <Text className="mt-2 text-sm text-zinc-300">{venue.location}</Text>

        {venue.musicGenre.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {venue.musicGenre.map((genre) => (
              <View key={genre} className="rounded-full border border-zinc-800 px-3 py-1">
                <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-300">
                  {genre}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="mt-5 flex-row items-center justify-between">
          <View className={`rounded-full px-5 py-3 ${isLive ? 'bg-red-500' : 'bg-zinc-100'}`}>
            <Text className={`text-sm font-semibold ${isLive ? 'text-white' : 'text-zinc-950'}`}>
              {isLive ? 'Watch live' : 'View venue'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
