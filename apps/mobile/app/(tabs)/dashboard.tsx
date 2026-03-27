import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  fetchMyVenues,
  useAuthStore,
  VenueWithStats,
} from '@vibecheck/shared';
import AuthPanel from '@/components/AuthPanel';
import { useNotifications } from '@/hooks/useNotifications';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, hydrate, logout } = useAuthStore();
  const { unregisterToken } = useNotifications();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );

  const loadDashboard = async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyVenues(authToken);
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    void loadDashboard(token);
  }, [token]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    await loadDashboard(token);
    setRefreshing(false);
  }, [token]);

  if (!user || !token) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-3xl font-semibold text-zinc-100">Dashboard</Text>
          <View className="mt-6">
            <AuthPanel
              title="Sign in to your dashboard"
              body="Your linked venues and live stream controls live here."
            />
          </View>
        </ScrollView>
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
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-semibold text-zinc-100">Dashboard</Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-400">
              Your linked venues and live streaming controls.
            </Text>
          </View>
          <Pressable onPress={async () => { if (token) await unregisterToken(token); await logout(); }} className="rounded-full border border-zinc-700 px-3 py-2">
            <Text className="text-xs font-medium text-zinc-300">Log out</Text>
          </Pressable>
        </View>

        <View className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4">
          <Text className="text-xs uppercase tracking-[2px] text-zinc-500">Signed in as</Text>
          <Text className="mt-2 text-base font-semibold text-zinc-100">{user.name}</Text>
          <Text className="mt-1 text-sm text-zinc-400">{user.email}</Text>
        </View>

        {loading ? (
          <View className="mt-10 items-center justify-center">
            <ActivityIndicator color="#f4f4f5" />
            <Text className="mt-3 text-sm text-zinc-400">Loading venues...</Text>
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
              Once you own a venue or receive a promoter invite, it will show up here.
            </Text>
          </View>
        ) : null}

        {venues.map((venue) => (
          <View key={venue.id} className="mb-5 rounded-[28px] border border-zinc-800 bg-zinc-900 p-5">
            <View className="mb-4 flex-row items-start justify-between gap-3">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-semibold text-zinc-100">{venue.name}</Text>
                <Text className="mt-1 text-sm text-zinc-400">{venue.location}</Text>
              </View>
              {venue.isLive && (
                <View className="flex-row items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
                  <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <Text className="text-xs font-semibold text-red-400">
                    LIVE · {venue.currentViewerCount}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              {canBroadcast ? (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/broadcast/[venueId]',
                      params: { venueId: venue.id },
                    })
                  }
                  className={`flex-1 rounded-2xl px-4 py-3 ${venue.isLive ? 'bg-zinc-100' : 'bg-red-500'}`}
                >
                  <Text className={`text-center text-sm font-semibold ${venue.isLive ? 'text-zinc-950' : 'text-white'}`}>
                    {venue.isLive ? 'View Stream' : 'Go Live'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/venues/[id]',
                    params: { id: venue.id },
                  })
                }
                className={`${canBroadcast ? 'flex-1' : 'w-full'} rounded-2xl border border-zinc-700 px-4 py-3`}
              >
                <Text className="text-center text-sm font-medium text-zinc-300">View venue</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
