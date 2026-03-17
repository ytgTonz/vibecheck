import { View, Text } from 'react-native';
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

export default function VenueCard({ venue }: { venue: Venue }) {
  return (
    <View className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Header: name + type badge */}
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 text-lg font-semibold text-zinc-100">
          {venue.name}
        </Text>
        <View className="ml-2 rounded-full bg-zinc-800 px-3 py-1">
          <Text className="text-xs font-medium text-zinc-300">
            {venueTypeLabel[venue.type] ?? venue.type}
          </Text>
        </View>
      </View>

      {/* Location */}
      <Text className="mb-2 text-sm text-zinc-400">{venue.location}</Text>

      {/* Hours */}
      {venue.hours && (
        <Text className="mb-2 text-sm text-zinc-500">
          <Text className="text-zinc-400">Hours: </Text>
          {venue.hours}
        </Text>
      )}

      {/* Music genre tags */}
      {venue.musicGenre.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {venue.musicGenre.map((genre) => (
            <View key={genre} className="rounded-md bg-zinc-800 px-2 py-0.5">
              <Text className="text-xs text-zinc-300">{genre}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
