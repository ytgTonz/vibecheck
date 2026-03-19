import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, createVideoPlayer } from 'expo-video';
import { setBaseUrl, fetchVenue, fetchVenueClips, recordClipView, Clip, Venue, useAuthStore } from '@vibecheck/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
setBaseUrl(API_URL);

const SWIPE_X_THRESHOLD = 56;
const SWIPE_Y_THRESHOLD = 84;

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

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

function ClipPreviewCard({
  clip,
  featured = false,
  onPress,
}: {
  clip: Clip;
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 ${
        featured ? 'h-[420px] w-full' : 'mr-3 h-[280px] w-[190px]'
      }`}
    >
      {clip.thumbnail ? (
        <Image
          source={{ uri: clip.thumbnail }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
      ) : null}

      <View className="absolute inset-0 bg-black/35" />
      <View className="absolute inset-0 justify-between p-4">
        <View className="flex-row items-center justify-between">
          <View className="rounded-full border border-white/15 bg-black/35 px-3 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-white/85">
              {featured ? 'Latest Vibe' : 'Story'}
            </Text>
          </View>
          <View className="rounded-full bg-black/35 px-2.5 py-1">
            <Text className="text-xs font-medium text-white">
              {formatDuration(clip.duration)}
            </Text>
          </View>
        </View>

        <View>
          <Text className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-orange-100">
            {timeAgo(clip.createdAt)}
            {clip.views > 0 ? ` • ${clip.views} views` : ''}
          </Text>
          <Text
            className={`text-white ${featured ? 'text-2xl font-semibold' : 'text-lg font-semibold'}`}
            numberOfLines={featured ? 3 : 2}
          >
            {clip.caption || 'See what the room feels like right now'}
          </Text>
          <Text className="mt-4 text-sm text-zinc-200">
            {featured ? 'Open full story viewer' : 'Tap to watch'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function StoryViewer({
  clips,
  activeIndex,
  venueName,
  onClose,
  onNavigate,
  onView,
}: {
  clips: Clip[];
  activeIndex: number;
  venueName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onView: (clipId: string) => void;
}) {
  const clip = clips[activeIndex];
  const viewedClipIds = useRef<Set<string>>(new Set());
  const lastGestureAtRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip?.duration ?? 0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [player] = useState(() => {
    const instance = createVideoPlayer(null);
    instance.loop = false;
    instance.timeUpdateEventInterval = 0.25;
    return instance;
  });

  useEffect(() => {
    return () => {
      player.release();
    };
  }, [player]);

  useEffect(() => {
    if (!clip) return;

    let cancelled = false;
    setCurrentTime(0);
    setDuration(clip.duration);
    setIsPlaying(true);

    const timeSub = player.addListener('timeUpdate', ({ currentTime: nextTime }) => {
      setCurrentTime(nextTime);
      if (!viewedClipIds.current.has(clip.id) && nextTime > 0) {
        viewedClipIds.current.add(clip.id);
        onView(clip.id);
      }
    });

    const playingSub = player.addListener('playingChange', ({ isPlaying: nextPlaying }) => {
      setIsPlaying(nextPlaying);
    });

    const loadSub = player.addListener('sourceLoad', ({ duration: loadedDuration }) => {
      setDuration(loadedDuration || clip.duration);
    });

    const endSub = player.addListener('playToEnd', () => {
      if (activeIndex < clips.length - 1) {
        onNavigate(activeIndex + 1);
        return;
      }

      setIsPlaying(false);
    });

    void player
      .replaceAsync({ uri: clip.videoUrl })
      .then(() => {
        if (cancelled) return;
        player.play();
      })
      .catch(() => {
        if (cancelled) return;
        setIsPlaying(false);
      });

    return () => {
      cancelled = true;
      timeSub.remove();
      playingSub.remove();
      loadSub.remove();
      endSub.remove();
    };
  }, [activeIndex, clip, clips.length, onNavigate, onView, player]);

  if (!clip) {
    return null;
  }

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < clips.length - 1;
  const progress = duration > 0 ? currentTime / duration : 0;

  const goPrev = () => {
    if (!canGoPrev) return;
    onNavigate(activeIndex - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    onNavigate(activeIndex + 1);
  };

  const handleTogglePlayback = () => {
    if (Date.now() - lastGestureAtRef.current < 250) return;

    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 12 || Math.abs(gestureState.dy) > 12,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > absY && absX > SWIPE_X_THRESHOLD) {
          lastGestureAtRef.current = Date.now();
          if (dx < 0) {
            goNext();
          } else {
            goPrev();
          }
          return;
        }

        if (absY > absX && dy > SWIPE_Y_THRESHOLD) {
          lastGestureAtRef.current = Date.now();
          onClose();
        }
      },
    })
  ).current;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
        <View className="absolute inset-0 bg-black" />
        {clip.thumbnail ? (
          <Image
            source={{ uri: clip.thumbnail }}
            resizeMode="cover"
            blurRadius={24}
            className="absolute inset-0 h-full w-full opacity-20"
          />
        ) : null}

        <View className="flex-1 px-3 pb-3">
          <View className="mb-3 mt-1 flex-row items-center gap-2">
            {clips.map((item, index) => (
              <View key={item.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                <View
                  className="h-full rounded-full bg-white"
                  style={{
                    width:
                      index < activeIndex
                        ? '100%'
                        : index === activeIndex
                          ? `${progress * 100}%`
                          : '0%',
                  }}
                />
              </View>
            ))}
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <View className="max-w-[80%]">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-200">
                Live Venue Story
              </Text>
              <Text className="mt-1 text-2xl font-semibold text-white">
                {venueName}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35"
            >
              <Text className="text-xl text-white">×</Text>
            </Pressable>
          </View>

          <View
            className="relative flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950"
            {...panResponder.panHandlers}
          >
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />

            <View className="absolute inset-0 z-10 flex-row">
              <Pressable
                onPress={goPrev}
                className="flex-1"
                accessibilityRole="button"
                accessibilityLabel="Previous clip"
              />
              <Pressable
                onPress={handleTogglePlayback}
                className="flex-1"
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause clip' : 'Play clip'}
              />
              <Pressable
                onPress={goNext}
                className="flex-1"
                accessibilityRole="button"
                accessibilityLabel="Next clip"
              />
            </View>

            {!isPlaying && (
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-black/35">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-white/12">
                  <Text className="ml-1 text-3xl text-white">▶</Text>
                </View>
              </View>
            )}

            <View pointerEvents="none" className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-10">
              <Text className="text-lg font-semibold text-white">
                {clip.caption || 'Current room energy'}
              </Text>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [venueData, clipsData] = await Promise.all([fetchVenue(id), fetchVenueClips(id)]);
      setVenue(venueData);
      setClips(clipsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load venue');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleView = (clipId: string) => {
    recordClipView(clipId)
      .then(({ views }) => {
        setClips((prev) => prev.map((clip) => (clip.id === clipId ? { ...clip, views } : clip)));
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f4f4f5" />
          <Text className="mt-3 text-zinc-400">Loading venue…</Text>
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

  const featuredClip = clips[0] ?? null;
  const railClips = clips.slice(1);

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
            <Text className="text-sm text-zinc-400">← All venues</Text>
          </Pressable>

          <View className="mb-6 overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 px-4 py-5">
            <View className="mb-4 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-200">
                  Live Venue Feed
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
            <Text className="mt-3 text-sm leading-6 text-zinc-300">
              Fast, recent clips that show whether the room is warm, packed, or worth the drive.
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-zinc-900 px-3 py-1.5">
                <Text className="text-sm text-zinc-100">{venue.location}</Text>
              </View>
              {venue.lastClipAt && (
                <View className="rounded-full bg-zinc-900 px-3 py-1.5">
                  <Text className="text-sm text-zinc-100">
                    Updated {timeAgo(venue.lastClipAt)}
                  </Text>
                </View>
              )}
              <View className="rounded-full bg-zinc-900 px-3 py-1.5">
                <Text className="text-sm text-zinc-100">
                  {clips.length} clips live
                </Text>
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

          {featuredClip ? (
            <View className="mb-6">
              <Text className="mb-3 text-sm font-semibold uppercase tracking-[2px] text-zinc-400">
                Latest vibe
              </Text>
              <ClipPreviewCard
                clip={featuredClip}
                featured
                onPress={() => setActiveClipIndex(0)}
              />
            </View>
          ) : (
            <View className="mb-6 rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
              <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-orange-200">
                No clips yet
              </Text>
              <Text className="mt-3 text-2xl font-semibold text-zinc-100">
                This venue is waiting for its first vibe drop.
              </Text>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-lg font-semibold text-zinc-100">
              {featuredClip ? 'More stories' : 'Story rail'}
            </Text>
            <Text className="mt-1 text-sm text-zinc-400">
              Tap through the latest clips like status updates, not a gallery.
            </Text>
          </View>

          {clips.length === 0 ? (
            <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
              <Text className="text-sm text-zinc-400">
                No clips yet. Be the first to share the vibe.
              </Text>
            </View>
          ) : railClips.length === 0 ? (
            <View className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
              <Text className="text-sm text-zinc-400">
                One live clip is up now. More stories will stack here as the night fills out.
              </Text>
            </View>
          ) : (
            <FlatList
              horizontal
              data={railClips}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ClipPreviewCard
                  clip={item}
                  onPress={() => setActiveClipIndex(index + 1)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          )}

          <View className="mt-8 rounded-[24px] border border-zinc-800 bg-zinc-900 p-5">
            <Text className="text-xl font-semibold text-zinc-100">
              Venue details
            </Text>
            <Text className="mt-1 text-sm text-zinc-400">
              More information about the Venue!
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

      {activeClipIndex !== null && clips[activeClipIndex] ? (
        <StoryViewer
          clips={clips}
          activeIndex={activeClipIndex}
          venueName={venue.name}
          onClose={() => setActiveClipIndex(null)}
          onNavigate={setActiveClipIndex}
          onView={handleView}
        />
      ) : null}
    </SafeAreaView>
  );
}
