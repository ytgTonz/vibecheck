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

const venueTypeAccent: Record<string, string> = {
  NIGHTCLUB: 'bg-fuchsia-400',
  BAR: 'bg-amber-400',
  RESTAURANT_BAR: 'bg-orange-300',
  LOUNGE: 'bg-cyan-400',
  SHISA_NYAMA: 'bg-red-400',
  ROOFTOP: 'bg-sky-400',
  OTHER: 'bg-zinc-400',
};

export default function VenueCard({ venue }: { venue: Venue }) {
  const router = useRouter();
  const isLive = venue.isLive;
  const accent = isLive ? 'bg-red-500' : (venueTypeAccent[venue.type] ?? venueTypeAccent.OTHER);

  return (
    <Pressable
      onPress={() =>
        router.push(
          isLive
            ? { pathname: '/venues/[id]/live', params: { id: venue.id } }
            : { pathname: '/venues/[id]', params: { id: venue.id } }
        )
      }
      className={`mb-3 overflow-hidden rounded-[22px] border bg-zinc-950 px-4 py-3 active:opacity-90 ${isLive ? 'border-red-500/40' : 'border-zinc-800'}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 22,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center gap-2">
        <View className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-300">
          {isLive ? 'Live' : 'Offline'}
        </Text>
        <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-500">
          {venueTypeLabel[venue.type] ?? venue.type}
        </Text>
      </View>

      <Text className="mt-2 text-lg font-semibold text-zinc-100">
        {venue.name}
      </Text>

      <Text className="mt-2 text-sm text-zinc-300">
        {venue.location}
      </Text>

      {venue.musicGenre.length > 0 && (
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {venue.musicGenre.slice(0, 3).map((genre) => (
            <View key={genre} className="rounded-full border border-zinc-800 px-2.5 py-0.5">
              <Text className="text-[10px] uppercase tracking-[1.5px] text-zinc-400">
                {genre}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="mt-3">
        <View className="self-start rounded-full bg-zinc-900 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-200">
            {isLive ? 'Watch now' : 'View venue'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
