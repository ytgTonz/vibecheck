import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { fetchVenue, fetchStream, Venue, LiveStream, useAuthStore } from '@vibecheck/shared';
import { LiveStreamBanner } from '@/components/venue-detail/LiveStreamBanner';
import { VenueInfoCard } from '@/components/venue-detail/VenueInfoCard';
import { VenueDetailsCard } from '@/components/venue-detail/VenueDetailsCard';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (background = false) => {
    if (!id) return;
    if (!background) setError(null);
    try {
      const venueData = await fetchVenue(id);
      let liveStream: LiveStream | null = null;
      if (venueData.activeStreamId) {
        try {
          const stream = await fetchStream(venueData.activeStreamId);
          liveStream = stream.status === 'LIVE' ? stream : null;
        } catch {
          liveStream = null;
        }
      }
      setVenue(venueData);
      setActiveStream(liveStream);
    } catch (err) {
      if (!background) {
        setError(err instanceof Error ? err.message : 'Failed to load venue');
      }
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
    const interval = setInterval(() => { loadData(true); }, 10_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f4f4f5" />
          <Text className="mt-3 text-zinc-400">Loading venue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !venue) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-center text-base font-medium text-red-400">
            {error || 'Venue not found'}
          </Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-sm text-zinc-400">Back to browse</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a1a1aa"
            colors={['#a1a1aa']}
          />
        }
      >
        <View className="px-4 pt-2">
          <Pressable onPress={() => router.back()} className="mb-5 self-start">
            <Text className="text-sm text-zinc-400">{'\u2190'} All venues</Text>
          </Pressable>

          {venue.isLive && venue.activeStreamId && (
            <LiveStreamBanner
              activeStream={activeStream}
              onPress={() =>
                router.push({ pathname: '/venues/[id]/live', params: { id: venue.id } })
              }
            />
          )}

          {!venue.isLive && (
            <View className="mb-5 flex-row items-center gap-3 rounded-[28px] border border-zinc-800 bg-zinc-900/50 px-5 py-4">
              <View className="h-3 w-3 rounded-full bg-zinc-500" />
              <Text className="text-sm text-zinc-400">
                This venue is currently offline. Check back later.
              </Text>
            </View>
          )}

          <VenueInfoCard venue={venue} isOwner={!!user && venue.ownerId === user.id} />
          <VenueDetailsCard venue={venue} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
