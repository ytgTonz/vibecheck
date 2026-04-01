import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  fetchMyVenues,
  useAuthStore,
  VenueWithStats,
} from '@vibecheck/shared';
import AuthPanel from '@/components/AuthPanel';
import { unregisterNotificationToken } from '@/hooks/useNotifications';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, hydrate, logout } = useAuthStore();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );
  const isViewer = user?.role === 'VIEWER';

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
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
        <AuthPanel
          title="Dashboard"
          body="Your linked venues and live stream controls live here."
        />
      </SafeAreaView>
    );
  }

  if (isViewer) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-3xl font-bold text-zinc-100">Account</Text>
              <Text className="mt-1 text-sm text-zinc-400">Your viewer profile and verification status.</Text>
            </View>
            <Pressable
              onPress={async () => {
                if (token) await unregisterNotificationToken(token);
                await logout();
              }}
              className="rounded-full border border-zinc-700 px-4 py-2"
            >
              <Text className="text-xs font-medium text-zinc-300">Log out</Text>
            </Pressable>
          </View>

          <View className="mb-5 rounded-[20px] border border-zinc-800 bg-zinc-900 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">
              Signed in as
            </Text>
            <Text className="mt-2 text-base font-semibold text-zinc-100">{user.name}</Text>
            <Text className="mt-0.5 text-sm text-zinc-400">{user.email}</Text>
            {user.phone ? (
              <Text className="mt-0.5 text-sm text-zinc-500">{user.phone}</Text>
            ) : null}
          </View>

          <View className="mb-5 rounded-[20px] border border-zinc-800 bg-zinc-900 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">
              Verification
            </Text>
            <View className="mt-3 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-zinc-300">Email</Text>
                <Text className={`text-sm font-medium ${user.emailVerified ? 'text-lime-400' : 'text-amber-400'}`}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-zinc-300">Phone</Text>
                <Text className={`text-sm font-medium ${user.phoneVerified ? 'text-lime-400' : 'text-amber-400'}`}>
                  {user.phoneVerified ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>

          <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-8 items-center">
            <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center mb-4">
              <Ionicons name="sparkles-outline" size={28} color="#a1a1aa" />
            </View>
            <Text className="text-base font-semibold text-zinc-100 mb-2">Ready to explore</Text>
            <Text className="text-sm text-zinc-500 text-center leading-relaxed max-w-[240px]">
              Browse live venues, track your visits, and claim perks when you arrive.
            </Text>
            <Pressable
              onPress={() => router.push('/')}
              className="mt-5 rounded-2xl bg-zinc-100 px-5 py-3"
            >
              <Text className="text-sm font-semibold text-zinc-950">Back to browse</Text>
            </Pressable>
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
        {/* Header */}
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-zinc-100">Dashboard</Text>
            <Text className="mt-1 text-sm text-zinc-400">Your venues and live controls.</Text>
          </View>
          <Pressable
            onPress={async () => {
              if (token) await unregisterNotificationToken(token);
              await logout();
            }}
            className="rounded-full border border-zinc-700 px-4 py-2"
          >
            <Text className="text-xs font-medium text-zinc-300">Log out</Text>
          </Pressable>
        </View>

        {/* Signed-in-as card */}
        <View className="mb-5 rounded-[20px] border border-zinc-800 bg-zinc-900 px-4 py-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">
            Signed in as
          </Text>
          <Text className="mt-2 text-base font-semibold text-zinc-100">{user.name}</Text>
          <Text className="mt-0.5 text-sm text-zinc-400">{user.email}</Text>
        </View>

        {loading && (
          <View className="mt-8 items-center justify-center">
            <ActivityIndicator color="#f4f4f5" />
            <Text className="mt-3 text-sm text-zinc-400">Loading venues...</Text>
          </View>
        )}

        {error && (
          <View className="mb-5 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3">
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && venues.length === 0 && (
          <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-8 items-center">
            <View className="w-14 h-14 rounded-full bg-zinc-800 items-center justify-center mb-4">
              <Ionicons name="business-outline" size={28} color="#52525b" />
            </View>
            <Text className="text-base font-semibold text-zinc-100 mb-2">No linked venues yet</Text>
            <Text className="text-sm text-zinc-500 text-center leading-relaxed max-w-[240px]">
              Once you own a venue or receive a promoter invite, it will show up here.
            </Text>
          </View>
        )}

        {/* Venue cards */}
        {venues.map((venue) => (
          <View key={venue.id} className="mb-4 rounded-[24px] border border-zinc-800 bg-zinc-900 px-5 py-6">
            <View className="mb-5 flex-row items-start justify-between gap-3">
              <View className="flex-1 pr-2">
                <Text className="text-2xl font-semibold text-zinc-100">{venue.name}</Text>
                <Text className="mt-1.5 text-sm text-zinc-400">{venue.location}</Text>
              </View>
              {venue.isLive && (
                <View className="flex-row items-center gap-1.5 rounded-lg bg-brand-red px-3 py-1.5">
                  <Text className="text-xs font-semibold text-white">
                    LIVE · {venue.currentViewerCount}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              {canBroadcast && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/broadcast/[venueId]',
                      params: { venueId: venue.id },
                    })
                  }
                  className={`flex-1 rounded-2xl px-4 py-3.5 ${
                    venue.isLive ? 'bg-zinc-100' : 'bg-brand-red'
                  }`}
                >
                  <Text
                    className={`text-center text-[15px] font-semibold ${
                      venue.isLive ? 'text-zinc-950' : 'text-white'
                    }`}
                  >
                    {venue.isLive ? 'View stream' : 'Go live'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/venues/[id]', params: { id: venue.id } })
                }
                className={`${canBroadcast ? 'flex-1' : 'w-full'} rounded-2xl border border-zinc-700 px-4 py-3.5`}
              >
                <Text className="text-center text-[15px] font-medium text-zinc-300">View venue</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
