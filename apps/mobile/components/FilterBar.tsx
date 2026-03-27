import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { VenueType, useVenueStore } from '@vibecheck/shared';

const venueTypeOptions: { value: VenueType; label: string }[] = [
  { value: VenueType.NIGHTCLUB, label: 'Nightclub' },
  { value: VenueType.BAR, label: 'Bar' },
  { value: VenueType.LOUNGE, label: 'Lounge' },
  { value: VenueType.SHISA_NYAMA, label: 'Shisa nyama' },
  { value: VenueType.ROOFTOP, label: 'Rooftop' },
  { value: VenueType.RESTAURANT_BAR, label: 'Restaurant & Bar' },
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

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-1.5 ${
        active ? 'bg-zinc-100' : 'bg-zinc-800 border border-zinc-700'
      }`}
    >
      <Text className={`text-xs ${active ? 'text-zinc-950 font-medium' : 'text-zinc-400'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function FilterBar() {
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);
  const setVenueTypeFilter = useVenueStore((s) => s.setVenueTypeFilter);
  const setMusicGenreFilter = useVenueStore((s) => s.setMusicGenreFilter);
  const clearFilters = useVenueStore((s) => s.clearFilters);
  const genreOptions = useGenreOptions();
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <View className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-4 gap-4">
        {/* Venue type */}
        <View>
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500 mb-3">
            Venue type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pill
              label="All"
              active={venueTypeFilter === null}
              onPress={() => setVenueTypeFilter(null)}
            />
            {venueTypeOptions.map((opt) => (
              <Pill
                key={opt.value}
                label={opt.label}
                active={venueTypeFilter === opt.value}
                onPress={() =>
                  setVenueTypeFilter(venueTypeFilter === opt.value ? null : opt.value)
                }
              />
            ))}
          </View>
        </View>

        {/* Music genre */}
        {genreOptions.length > 0 && (
          <View>
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500 mb-3">
              Music genre
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <Pill
                label="Any"
                active={musicGenreFilter === null}
                onPress={() => setMusicGenreFilter(null)}
              />
              {genreOptions.map((genre) => (
                <Pill
                  key={genre}
                  label={genre}
                  active={musicGenreFilter === genre}
                  onPress={() =>
                    setMusicGenreFilter(musicGenreFilter === genre ? null : genre)
                  }
                />
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 pt-1">
          <Pressable
            onPress={() => { clearFilters(); }}
            className="flex-1 rounded-2xl border border-zinc-700 py-3"
          >
            <Text className="text-center text-sm font-medium text-zinc-300">Clear all</Text>
          </Pressable>
          <Pressable
            onPress={() => setExpanded(false)}
            className="flex-1 rounded-2xl bg-zinc-100 py-3"
          >
            <Text className="text-center text-sm font-semibold text-zinc-950">Apply</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        <Pill
          label="All"
          active={venueTypeFilter === null && musicGenreFilter === null}
          onPress={() => { setVenueTypeFilter(null); setMusicGenreFilter(null); }}
        />
        {venueTypeOptions.map((opt) => (
          <Pill
            key={opt.value}
            label={opt.label}
            active={venueTypeFilter === opt.value}
            onPress={() =>
              setVenueTypeFilter(venueTypeFilter === opt.value ? null : opt.value)
            }
          />
        ))}
        <Pressable
          onPress={() => setExpanded(true)}
          className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5"
        >
          <Text className="text-xs text-zinc-400">More ›</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
