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
import {
  fetchVenue,
  fetchStream,
  Venue,
  LiveStream,
  useAuthStore,
} from '@vibecheck/shared';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

function liveSinceLabel(iso: string | null) {
  if (!iso) return 'Started moments ago';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `Started ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Started ${hours}h ago`;
  return `Started ${new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

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

    const interval = setInterval(() => {
      loadData(true);
    }, 10_000);

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

          {/* Live stream banner */}
          {venue.isLive && venue.activeStreamId && (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/venues/[id]/live', params: { id: venue.id } })
              }
              className="mb-5 overflow-hidden rounded-[28px] border border-red-500/30 bg-zinc-950"
            >
              <View className="absolute inset-0 bg-red-500/10" />
              <View className="px-5 py-5">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-row items-center gap-2 rounded-full bg-red-500 px-3 py-1.5">
                    <View className="h-2.5 w-2.5 rounded-full bg-white" />
                    <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white">
                      Live
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-red-200">
                    {activeStream
                      ? `${compactNumber(activeStream.currentViewerCount)} watching`
                      : 'Join now'}
                  </Text>
                </View>

                <Text className="mt-5 text-3xl font-semibold text-zinc-100">
                  Watch the room live.
                </Text>
                <Text className="mt-3 text-sm leading-6 text-zinc-300">
                  See the floor, crowd energy, and current vibe in real time.
                </Text>

                <View className="mt-5 flex-row flex-wrap gap-2">
                  <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                    <Text className="text-sm text-zinc-100">
                      {activeStream ? liveSinceLabel(activeStream.startedAt) : 'Live right now'}
                    </Text>
                  </View>
                  {activeStream ? (
                    <View className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                      <Text className="text-sm text-zinc-100">
                        Peak {compactNumber(activeStream.viewerPeak)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View className="mt-6 flex-row items-center justify-between gap-4">
                  <Text className="flex-1 text-sm text-zinc-400">
                    Open the full-screen live view with chat.
                  </Text>
                  <View className="rounded-full bg-red-500 px-5 py-3">
                    <Text className="text-sm font-semibold text-white">Watch live</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}

          {/* Offline status */}
          {!venue.isLive && (
            <View className="mb-5 flex-row items-center gap-3 rounded-[28px] border border-zinc-800 bg-zinc-900/50 px-5 py-4">
              <View className="h-3 w-3 rounded-full bg-zinc-500" />
              <Text className="text-sm text-zinc-400">
                This venue is currently offline. Check back later.
              </Text>
            </View>
          )}

          {/* Venue info */}
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

            <Text className="text-4xl font-semibold text-zinc-100">
              {venue.name}
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-zinc-900 px-3 py-1.5">
                <Text className="text-sm text-zinc-100">{venue.location}</Text>
              </View>
              {user && venue.ownerId === user.id && (
                <View className="rounded-full bg-emerald-500/15 px-3 py-1.5">
                  <Text className="text-sm font-medium text-emerald-300">
                    You own this venue
                  </Text>
                </View>
              )}
            </View>

            {venue.musicGenre.length > 0 && (
              <View className="mt-5 flex-row flex-wrap gap-2">
                {venue.musicGenre.map((genre) => (
                  <View
                    key={genre}
                    className="rounded-full border border-zinc-800 px-3 py-1"
                  >
                    <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-300">
                      {genre}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Venue details */}
          <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
            <Text className="text-xl font-semibold text-zinc-100">
              Venue details
            </Text>
            <Text className="mt-1 text-sm text-zinc-400">
              The practical stuff for planning your night.
            </Text>

            <View className="mt-5 gap-4">
              <View>
                <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">
                  Location
                </Text>
                <Text className="mt-1 text-base text-zinc-100">{venue.location}</Text>
              </View>

              {venue.hours && (
                <View>
                  <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">
                    Hours
                  </Text>
                  <Text className="mt-1 text-base text-zinc-100">{venue.hours}</Text>
                </View>
              )}

              {venue.coverCharge && (
                <View>
                  <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">
                    Cover
                  </Text>
                  <Text className="mt-1 text-base text-zinc-100">{venue.coverCharge}</Text>
                </View>
              )}

              {venue.drinkPrices && (
                <View>
                  <Text className="text-xs uppercase tracking-[1.5px] text-zinc-500">
                    Drinks
                  </Text>
                  <Text className="mt-1 text-base text-zinc-100">{venue.drinkPrices}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
