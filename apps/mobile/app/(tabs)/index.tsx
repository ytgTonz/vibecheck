import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useVenueStore,
  Venue,
  filterVenues,
  groupBrowseVenues,
  pickFeaturedVenue,
  excludeFeaturedVenue,
} from '@vibecheck/shared';
import VenueCard from '@/components/VenueCard';
import FeaturedVenueCard from '@/components/FeaturedVenueCard';
import FilterBar from '@/components/FilterBar';

export default function BrowseScreen() {
  const loading = useVenueStore((s) => s.loading);
  const error = useVenueStore((s) => s.error);
  const loadVenues = useVenueStore((s) => s.loadVenues);
  const venues = useVenueStore((s) => s.venues);
  const venueTypeFilter = useVenueStore((s) => s.venueTypeFilter);
  const musicGenreFilter = useVenueStore((s) => s.musicGenreFilter);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  }, [loadVenues]);

  const filtered = useMemo(
    () => filterVenues(venues, venueTypeFilter, musicGenreFilter),
    [venues, venueTypeFilter, musicGenreFilter]
  );
  const groups = useMemo(() => groupBrowseVenues(filtered), [filtered]);
  const liveCount = groups.live.length;
  const streamingCount = groups.streaming.length;

  const featuredVenue = useMemo(() => pickFeaturedVenue(groups), [groups]);
  const streamingSectionVenues = useMemo(
    () => excludeFeaturedVenue(groups.streaming, featuredVenue),
    [groups.streaming, featuredVenue]
  );
  const liveSectionVenues = useMemo(
    () => excludeFeaturedVenue(groups.live, featuredVenue),
    [groups.live, featuredVenue]
  );
  const freshSectionVenues = useMemo(
    () => excludeFeaturedVenue(groups.fresh, featuredVenue),
    [groups.fresh, featuredVenue]
  );
  const quietSectionVenues = useMemo(
    () => excludeFeaturedVenue(groups.quiet, featuredVenue),
    [groups.quiet, featuredVenue]
  );

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a1a1aa"
              colors={['#a1a1aa']}
            />
          }
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
            {streamingCount > 0 ? ` · ${streamingCount} streaming live` : ''}
            {liveCount > 0 ? ` · ${liveCount} live now` : ''}
          </Text>

          {featuredVenue ? (
            <View className="mb-8">
              <FeaturedVenueCard venue={featuredVenue} />
            </View>
          ) : null}

          {renderSection('Streaming live', streamingSectionVenues)}
          {renderSection('Live now', liveSectionVenues)}
          {renderSection('Fresh tonight', freshSectionVenues)}
          {renderSection('More venues', quietSectionVenues)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
