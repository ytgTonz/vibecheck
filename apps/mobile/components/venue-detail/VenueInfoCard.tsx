import { Text, View } from 'react-native';
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

interface VenueInfoCardProps {
  venue: Venue;
  isOwner: boolean;
}

export function VenueInfoCard({ venue, isOwner }: VenueInfoCardProps) {
  return (
    <View className="mb-6 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 px-4 py-5">
      <View className="mb-4 flex-row flex-wrap items-center gap-2">
        <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-200">
            Venue
          </Text>
        </View>
        <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
          <Text className="text-xs text-zinc-300">
            {venueTypeLabel[venue.type] ?? venue.type}
          </Text>
        </View>
      </View>

      <Text className="text-4xl font-semibold text-zinc-100">{venue.name}</Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-zinc-900 px-3 py-1.5">
          <Text className="text-sm text-zinc-100">{venue.location}</Text>
        </View>
        {isOwner && (
          <View className="rounded-full bg-emerald-500/15 px-3 py-1.5">
            <Text className="text-sm font-medium text-emerald-300">You own this venue</Text>
          </View>
        )}
      </View>

      {venue.musicGenre.length > 0 && (
        <View className="mt-5 flex-row flex-wrap gap-2">
          {venue.musicGenre.map((genre) => (
            <View key={genre} className="rounded-full border border-zinc-800 px-3 py-1">
              <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-300">{genre}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
