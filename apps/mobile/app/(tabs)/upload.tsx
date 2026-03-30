import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { fetchMyVenues, useAuthStore, VenueWithStats } from '@vibecheck/shared';
import AuthPanel from '@/components/AuthPanel';

function BroadcastVenueCard({
  venue,
  onPress,
}: {
  venue: VenueWithStats;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-4 rounded-[28px] border px-5 py-5 ${
        venue.isLive ? 'border-brand-red/30 bg-brand-red/10' : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-semibold text-zinc-100">{venue.name}</Text>
          <Text className="mt-1 text-sm text-zinc-400">{venue.location}</Text>
        </View>
        {venue.isLive ? (
          <View className="rounded-full bg-brand-red/20 px-2.5 py-1">
            <Text className="text-xs font-semibold text-red-300">
              LIVE · {venue.currentViewerCount}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="mt-4 text-sm leading-6 text-zinc-400">
        {venue.isLive
          ? 'Open the live control room for this venue.'
          : 'Start broadcasting live from this venue right now.'}
      </Text>

      <View className={`mt-5 self-start rounded-full px-4 py-2 ${
        venue.isLive ? 'bg-zinc-100' : 'bg-brand-red'
      }`}>
        <Text className={`text-sm font-semibold ${venue.isLive ? 'text-zinc-950' : 'text-white'}`}>
          {venue.isLive ? 'View Stream' : 'Go Live'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GoLiveScreen() {
  const router = useRouter();
  const { user, token, hydrate } = useAuthStore();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );

  const loadVenues = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyVenues(token);
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venues.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    void loadVenues();
  }, [loadVenues, token]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVenues();
    setRefreshing(false);
  }, [loadVenues]);

  if (!user || !token) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
        <AuthPanel
          title="Go Live"
          body="Sign in as a venue owner or promoter to start broadcasting."
        />
      </SafeAreaView>
    );
  }

  if (!canBroadcast) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-xl font-semibold text-zinc-100">Broadcast access required</Text>
          <Text className="mt-3 text-center text-sm leading-6 text-zinc-400">
            Only venue owners and promoters can start a live stream from mobile.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#a1a1aa"
            colors={['#a1a1aa']}
          />
        }
      >
        <View className="mb-6">
          <Text className="text-3xl font-semibold text-zinc-100">Go Live</Text>
          <Text className="mt-2 text-sm leading-6 text-zinc-400">
            Choose a linked venue and jump straight into the mobile broadcast room.
          </Text>
        </View>

        <View className="mb-6 rounded-[32px] border border-brand-red/30 bg-brand-red/10 px-5 py-5">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
            Mobile Broadcast
          </Text>
          <Text className="mt-4 text-2xl font-semibold text-zinc-100">
            Start streaming with one tap.
          </Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-300">
            The middle tab is now your live control surface. Pick a venue, open the camera, and go live.
          </Text>
        </View>

        {loading ? (
          <View className="mt-10 items-center justify-center">
            <ActivityIndicator color="#f4f4f5" />
            <Text className="mt-3 text-sm text-zinc-400">Loading linked venues...</Text>
          </View>
        ) : null}

        {error ? (
          <View className="mb-5 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3">
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        ) : null}

        {!loading && venues.length === 0 ? (
          <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
            <Text className="text-lg font-semibold text-zinc-100">No linked venues yet</Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-400">
              Once you own a venue or receive a promoter invite, it will show up here for live broadcasting.
            </Text>
          </View>
        ) : null}

        {venues.map((venue) => (
          <BroadcastVenueCard
            key={venue.id}
            venue={venue}
            onPress={() =>
              router.push({
                pathname: '/broadcast/[venueId]',
                params: { venueId: venue.id },
              })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
