import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  deleteClip,
  fetchMyVenues,
  setBaseUrl,
  useAuthStore,
  VenueWithStats,
} from '@vibecheck/shared';
import AuthPanel from '@/components/AuthPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
setBaseUrl(API_URL);

function formatDuration(seconds: number) {
  const totalSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, token, hydrate, logout } = useAuthStore();
  const [venues, setVenues] = useState<VenueWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null);

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
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    void loadDashboard(token);
  }, [token]);

  const handleDeleteClip = async (clipId: string) => {
    if (!token) return;

    setDeletingClipId(clipId);
    try {
      await deleteClip(clipId, token);
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove clip');
    } finally {
      setDeletingClipId(null);
    }
  };

  if (!user || !token) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-3xl font-semibold text-zinc-100">Dashboard</Text>
          <Text className="mt-2 text-sm text-zinc-400">
            Sign in to see the venues you own or help manage.
          </Text>
          <View className="mt-6">
            <AuthPanel
              title="Sign in to your dashboard"
              body="Your linked venues, clip stats, and recent posts live here."
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-semibold text-zinc-100">Dashboard</Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-400">
              Linked venues, basic stats, and recent clips in one place.
            </Text>
          </View>
          <Pressable onPress={logout} className="rounded-full border border-zinc-700 px-3 py-2">
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
            <Text className="mt-3 text-sm text-zinc-400">Loading venues…</Text>
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
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/venues/[id]',
                    params: { id: venue.id },
                  })
                }
                className="rounded-full border border-zinc-700 px-3 py-2"
              >
                <Text className="text-xs font-medium text-zinc-300">Open</Text>
              </Pressable>
            </View>

            <View className="mb-5 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-zinc-950 px-4 py-4">
                <Text className="text-2xl font-semibold text-zinc-100">{venue.stats.totalViews}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Views</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-zinc-950 px-4 py-4">
                <Text className="text-2xl font-semibold text-zinc-100">{venue.stats.totalClips}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">Clips</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-zinc-950 px-4 py-4">
                <Text className="text-2xl font-semibold text-zinc-100">{venue.stats.clipsThisWeek}</Text>
                <Text className="mt-1 text-xs uppercase tracking-[1.5px] text-zinc-500">This week</Text>
              </View>
            </View>

            <Text className="text-sm font-semibold text-zinc-200">Recent clips</Text>
            {venue.recentClips.length === 0 ? (
              <Text className="mt-3 text-sm text-zinc-500">No clips uploaded yet.</Text>
            ) : (
              <View className="mt-3 gap-3">
                {venue.recentClips.map((clip) => (
                  <View key={clip.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-semibold text-zinc-100">
                          {clip.caption || 'Untitled clip'}
                        </Text>
                        <Text className="mt-1 text-xs text-zinc-400">
                          {formatDuration(clip.duration)} • {timeAgo(clip.createdAt)}
                        </Text>
                        <Text className="mt-1 text-xs text-zinc-500">{clip.views} views</Text>
                      </View>
                      <Pressable
                        onPress={() => handleDeleteClip(clip.id)}
                        disabled={deletingClipId === clip.id}
                        className="rounded-full border border-zinc-700 px-3 py-2"
                        style={{ opacity: deletingClipId === clip.id ? 0.5 : 1 }}
                      >
                        <Text className="text-xs font-medium text-red-300">
                          {deletingClipId === clip.id ? 'Removing…' : 'Remove'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
