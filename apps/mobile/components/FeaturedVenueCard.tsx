import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Venue } from '@vibecheck/shared';
import { PulseDot } from './PulseDot';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

function getVibeLabel(score: number): { label: string; textColor: string; bgColor: string } {
  if (score >= 80) return { label: 'On Fire', textColor: 'text-red-400', bgColor: 'bg-red-500/20' };
  if (score >= 50) return { label: 'Heating Up', textColor: 'text-orange-400', bgColor: 'bg-orange-500/20' };
  if (score >= 20) return { label: 'Warming Up', textColor: 'text-amber-400', bgColor: 'bg-amber-500/20' };
  return { label: 'Chill', textColor: 'text-zinc-500', bgColor: 'bg-zinc-800' };
}

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
      android_ripple={{ color: 'rgba(255,255,255,0.07)', borderless: false }}
      className={`overflow-hidden rounded-[28px] border bg-zinc-950 active:opacity-90 ${isLive ? 'border-red-500/60' : 'border-zinc-800'}`}
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
          <PulseDot live={isLive} />
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-300">
            {isLive ? 'Live' : 'Offline'}
          </Text>
          <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
            <Text className="text-xs font-medium text-zinc-300">
              {venueTypeLabel[venue.type] ?? venue.type}
            </Text>
          </View>
          {venue.vibeScore != null && venue.vibeScore > 0 && (() => {
            const vibe = getVibeLabel(venue.vibeScore);
            return (
              <View className={`rounded-full px-3 py-1 ${vibe.bgColor}`}>
                <Text className={`text-xs font-semibold ${vibe.textColor}`}>
                  {vibe.label}
                </Text>
              </View>
            );
          })()}
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
