import { useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setBaseUrl, useVenueStore, Venue } from '@vibecheck/shared';
import VenueCard from '@/components/VenueCard';
import FeaturedVenueCard from '@/components/FeaturedVenueCard';
import FilterBar from '@/components/FilterBar';

// Point at the API server.
// For Expo Go on a physical device, use your machine's local IP.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
setBaseUrl(API_URL);

export default function BrowseScreen() {
  const loading = useVenueStore((s) => s.loading);
  const error = useVenueStore((s) => s.error);
  const loadVenues = useVenueStore((s) => s.loadVenues);
  const groupedVenues = useVenueStore((s) => s.groupedVenues);
  const filteredVenues = useVenueStore((s) => s.filteredVenues);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const groups = groupedVenues();
  const filtered = filteredVenues();
  const liveCount = groups.live.length;

  const featuredVenue =
    groups.live[0] ?? groups.fresh[0] ?? groups.quiet[0] ?? null;

  const excludeFeatured = (venues: Venue[]) =>
    featuredVenue ? venues.filter((venue) => venue.id !== featuredVenue.id) : venues;

  const liveSectionVenues = excludeFeatured(groups.live);
  const freshSectionVenues = excludeFeatured(groups.fresh);
  const quietSectionVenues = excludeFeatured(groups.quiet);

  const renderSection = (title: string, venues: Venue[]) => {
    if (venues.length === 0) return null;

    return (
      <View className="mb-8">
        <Text className="mb-4 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-400">
          {title}
        </Text>
        <View>
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
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

      {!loading && !error && filtered.length === 0 && (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-zinc-500">No venues match your filters.</Text>
        </View>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        >
          <View className="pb-4 pt-2">
            <Text className="text-3xl font-bold text-zinc-100">VibeCheck</Text>
            <Text className="mt-1 text-sm text-zinc-400">
              Open the venue stories before you decide where to pull up.
            </Text>
          </View>

          <View className="mb-4">
            <FilterBar />
          </View>

          <Text className="mb-6 text-xs text-zinc-500">
            {filtered.length} venue{filtered.length !== 1 ? 's' : ''}
            {liveCount > 0 ? ` · ${liveCount} live now` : ''}
          </Text>

          {featuredVenue ? (
            <View className="mb-8">
              <FeaturedVenueCard venue={featuredVenue} />
            </View>
          ) : null}

          {renderSection('Live now', liveSectionVenues)}
          {renderSection('Fresh tonight', freshSectionVenues)}
          {renderSection('More venues', quietSectionVenues)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
