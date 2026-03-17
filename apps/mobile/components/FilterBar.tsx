import { View, Text, ScrollView, Pressable } from 'react-native';
import { VenueType, useVenueStore } from '@vibecheck/shared';

const venueTypeOptions: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: 'Nightclub' },
  { value: VenueType.BAR, label: 'Bar' },
  { value: VenueType.RESTAURANT_BAR, label: 'Restaurant & Bar' },
  { value: VenueType.LOUNGE, label: 'Lounge' },
  { value: VenueType.SHISA_NYAMA, label: 'Shisa Nyama' },
  { value: VenueType.ROOFTOP, label: 'Rooftop' },
  { value: VenueType.OTHER, label: 'Other' },
];

function useGenreOptions(): string[] {
  const venues = useVenueStore((s) => s.venues);
  const genres = new Set<string>();
  for (const v of venues) {
    for (const g of v.musicGenre) {
      genres.add(g);
    }
  }
  return Array.from(genres).sort();
}

export default function FilterBar() {
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);
  const setVenueTypeFilter = useVenueStore((s) => s.setVenueTypeFilter);
  const setMusicGenreFilter = useVenueStore((s) => s.setMusicGenreFilter);
  const genreOptions = useGenreOptions();

  return (
    <View className="gap-2">
      {/* Venue type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 px-4">
          <Pressable
            onPress={() => setVenueTypeFilter(null)}
            className={`rounded-full px-3 py-1.5 ${
              venueTypeFilter === null
                ? 'bg-zinc-100'
                : 'bg-zinc-800'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                venueTypeFilter === null
                  ? 'text-zinc-900'
                  : 'text-zinc-300'
              }`}
            >
              All types
            </Text>
          </Pressable>
          {venueTypeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setVenueTypeFilter(
                  venueTypeFilter === opt.value ? null : opt.value
                )
              }
              className={`rounded-full px-3 py-1.5 ${
                venueTypeFilter === opt.value
                  ? 'bg-zinc-100'
                  : 'bg-zinc-800'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  venueTypeFilter === opt.value
                    ? 'text-zinc-900'
                    : 'text-zinc-300'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Music genre chips */}
      {genreOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 px-4">
            <Pressable
              onPress={() => setMusicGenreFilter(null)}
              className={`rounded-full px-3 py-1.5 ${
                musicGenreFilter === null
                  ? 'bg-zinc-100'
                  : 'bg-zinc-800'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  musicGenreFilter === null
                    ? 'text-zinc-900'
                    : 'text-zinc-300'
                }`}
              >
                All genres
              </Text>
            </Pressable>
            {genreOptions.map((genre) => (
              <Pressable
                key={genre}
                onPress={() =>
                  setMusicGenreFilter(
                    musicGenreFilter === genre ? null : genre
                  )
                }
                className={`rounded-full px-3 py-1.5 ${
                  musicGenreFilter === genre
                    ? 'bg-zinc-100'
                    : 'bg-zinc-800'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    musicGenreFilter === genre
                      ? 'text-zinc-900'
                      : 'text-zinc-300'
                  }`}
                >
                  {genre}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
