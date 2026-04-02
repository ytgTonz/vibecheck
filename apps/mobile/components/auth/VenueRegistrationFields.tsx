import { Pressable, Text, TextInput, View } from 'react-native';
import { VenueType, VENUE_TYPE_OPTIONS, MUSIC_GENRES } from '@vibecheck/shared';

interface VenueRegistrationFieldsProps {
  venueName: string;
  venueLocation: string;
  venueHours: string;
  venueType: VenueType | null;
  venueGenres: string[];
  onVenueNameChange: (v: string) => void;
  onVenueLocationChange: (v: string) => void;
  onVenueHoursChange: (v: string) => void;
  onVenueTypeChange: (v: VenueType) => void;
  onToggleGenre: (genre: string) => void;
}

export function VenueRegistrationFields({
  venueName,
  venueLocation,
  venueHours,
  venueType,
  venueGenres,
  onVenueNameChange,
  onVenueLocationChange,
  onVenueHoursChange,
  onVenueTypeChange,
  onToggleGenre,
}: VenueRegistrationFieldsProps) {
  return (
    <>
      <View className="mt-3">
        <Text className="mb-2 text-sm font-medium text-zinc-300">Venue details</Text>
      </View>

      <TextInput
        value={venueName}
        onChangeText={onVenueNameChange}
        placeholder="Venue name"
        placeholderTextColor="#71717a"
        className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
      />

      <TextInput
        value={venueLocation}
        onChangeText={onVenueLocationChange}
        placeholder="Location"
        placeholderTextColor="#71717a"
        className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
      />

      <TextInput
        value={venueHours}
        onChangeText={onVenueHoursChange}
        placeholder="Hours (optional)"
        placeholderTextColor="#71717a"
        className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100"
      />

      <View>
        <Text className="mb-2 text-sm text-zinc-400">Venue type</Text>
        <View className="flex-row flex-wrap gap-2">
          {VENUE_TYPE_OPTIONS.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => onVenueTypeChange(type.value)}
              className={`rounded-full border px-3 py-2 ${
                venueType === type.value
                  ? 'border-zinc-100 bg-zinc-100/10'
                  : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              <Text className="text-xs font-medium text-zinc-200">{type.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm text-zinc-400">Genres</Text>
        <View className="flex-row flex-wrap gap-2">
          {MUSIC_GENRES.map((genre) => {
            const selected = venueGenres.includes(genre);
            return (
              <Pressable
                key={genre}
                onPress={() => onToggleGenre(genre)}
                className={`rounded-full border px-3 py-2 ${
                  selected ? 'border-zinc-100 bg-zinc-100/10' : 'border-zinc-700 bg-zinc-900'
                }`}
              >
                <Text className="text-xs font-medium text-zinc-200">{genre}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
