import { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setBaseUrl, useVenueStore, Venue } from '@vibecheck/shared';
import VenueCard from '@/components/VenueCard';
import FilterBar from '@/components/FilterBar';

// Point at the API server.
// For Expo Go on a physical device, use your machine's local IP.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
setBaseUrl(API_URL);

export default function BrowseScreen() {
  const loading = useVenueStore((s) => s.loading);
  const error = useVenueStore((s) => s.error);
  const loadVenues = useVenueStore((s) => s.loadVenues);
  const allVenues = useVenueStore((s) => s.venues);
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);

  const venues = allVenues.filter((venue) => {
    if (venueTypeFilter && venue.type !== venueTypeFilter) return false;
    if (musicGenreFilter && !venue.musicGenre.includes(musicGenreFilter)) return false;
    return true;
  });

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 pb-4 pt-2">
        <Text className="text-3xl font-bold text-zinc-100">VibeCheck</Text>
        <Text className="mt-1 text-sm text-zinc-400">
          See the vibe before you arrive — East London
        </Text>
      </View>

      {/* Filters */}
      <View className="mb-3">
        <FilterBar />
      </View>

      {/* Content */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#a1a1aa" />
          <Text className="mt-3 text-zinc-500">Loading venues…</Text>
        </View>
      )}

      {error && (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-400">Error: {error}</Text>
        </View>
      )}

      {!loading && !error && venues.length === 0 && (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-zinc-500">No venues match your filters.</Text>
        </View>
      )}

      {!loading && !error && venues.length > 0 && (
        <FlatList<Venue>
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VenueCard venue={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
