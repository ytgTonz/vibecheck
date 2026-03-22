import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  fetchVenue,
  fetchStream,
  fetchViewerToken,
  Venue,
  LiveStream,
} from '@vibecheck/shared';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};
const QUICK_REACTIONS = ['🔥', '😍', '🕺', '🍾', '👏'] as const;

// LiveKit React Native imports
let LiveKitRoom: any;
let VideoTrack: any;
let useRemoteParticipants: any;
let useTracks: any;
let useChat: any;
let useRoomContext: any;
let isTrackReference: any;
let TrackSource: any;
let RoomEvent: any;
let AudioSession: any;
let AndroidAudioTypePresets: any;

try {
  const lkComponents = require('@livekit/react-native');
  LiveKitRoom = lkComponents.LiveKitRoom;
  VideoTrack = lkComponents.VideoTrack;
  useRemoteParticipants = lkComponents.useRemoteParticipants;
  useTracks = lkComponents.useTracks;
  useChat = lkComponents.useChat;
  useRoomContext = lkComponents.useRoomContext;
  isTrackReference = lkComponents.isTrackReference;
  AudioSession = lkComponents.AudioSession;
  AndroidAudioTypePresets = lkComponents.AndroidAudioTypePresets;
  const lkClient = require('livekit-client');
  TrackSource = lkClient.Track?.Source;
  RoomEvent = lkClient.RoomEvent;
} catch {
  // LiveKit native modules may not be available in Expo Go.
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

function isReactionMessage(message: string) {
  return QUICK_REACTIONS.includes(message.trim() as (typeof QUICK_REACTIONS)[number]);
}

function QuickReactionRow({
  onReact,
  vertical = false,
}: {
  onReact: (reaction: string) => void;
  vertical?: boolean;
}) {
  return (
    <View className={vertical ? 'items-center gap-2' : 'flex-row flex-wrap gap-2'}>
      {QUICK_REACTIONS.map((reaction) => (
        <Pressable
          key={reaction}
          onPress={() => onReact(reaction)}
          className={`rounded-full border border-white/10 bg-black/55 ${
            vertical ? 'h-11 w-11 items-center justify-center' : 'px-3 py-2'
          }`}
        >
          <Text className="text-lg">{reaction}</Text>
        </Pressable>
      ))}
    </View>
  );
}

type FloatingReaction = {
  id: number;
  emoji: string;
  left: number;
  bottom: number;
  size: number;
  drift: number;
  duration: number;
};

function FloatingReactionBubble({
  bubble,
  onDone,
}: {
  bubble: FloatingReaction;
  onDone: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: bubble.duration - 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -260,
        duration: bubble.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: bubble.drift,
        duration: bubble.duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.12,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: Math.max(220, bubble.duration - 260),
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onDone(bubble.id));
  }, [bubble, onDone, opacity, scale, translateX, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: bubble.left,
        bottom: bubble.bottom,
        width: bubble.size,
        height: bubble.size,
        borderRadius: bubble.size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 10, 12, 0.62)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        opacity,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    >
      <Text style={{ fontSize: bubble.size * 0.48 }}>{bubble.emoji}</Text>
    </Animated.View>
  );
}

function FloatingReactionLayer({
  reactions,
  onDone,
}: {
  reactions: FloatingReaction[];
  onDone: (id: number) => void;
}) {
  return (
    <View pointerEvents="none" className="absolute inset-0 z-[6]">
      {reactions.map((reaction) => (
        <FloatingReactionBubble
          key={reaction.id}
          bubble={reaction}
          onDone={onDone}
        />
      ))}
    </View>
  );
}

function ViewerCountBadge({
  viewerCount,
  peakCount,
}: {
  viewerCount: number;
  peakCount: number;
}) {
  return (
    <View className="items-end gap-2">
      <View className="flex-row items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
        <View className="h-2 w-2 rounded-full bg-red-500" />
        <Text className="text-xs font-semibold text-white">
          {compactNumber(viewerCount)} watching
        </Text>
      </View>
      {peakCount > 0 ? (
        <View className="rounded-full border border-white/10 bg-black/45 px-3 py-1">
          <Text className="text-[11px] text-zinc-200">
            Peak {compactNumber(peakCount)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function StreamEndedOverlay({ venueId, venueName }: { venueId: string; venueName: string }) {
  const router = useRouter();
  const room = useRoomContext?.();
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!room || !RoomEvent) return;

    const handleDisconnected = () => {
      setEnded(true);
    };

    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room]);

  if (!ended) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-30 items-center justify-center bg-black/85 px-6">
      <View className="w-full max-w-[320px] rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-7">
        <Text className="text-center text-3xl font-semibold text-white">
          Stream ended
        </Text>
        <Text className="mt-3 text-center text-sm leading-6 text-zinc-400">
          {venueName} has ended their live stream.
        </Text>

        <Pressable
          onPress={() =>
            router.replace({ pathname: '/venues/[id]', params: { id: venueId } })
          }
          className="mt-6 rounded-full bg-zinc-100 px-5 py-3"
        >
          <Text className="text-center text-sm font-semibold text-zinc-950">
            Back to venue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ChatOverlay({
  messages,
  onSend,
  visible,
  onToggle,
}: {
  messages: { from?: { name?: string; identity?: string }; message: string }[];
  onSend: (msg: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const messageCount = messages.length;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3"
    >
      {!visible ? (
        <View className="items-start">
          <Pressable
            onPress={onToggle}
            className="rounded-full border border-white/10 bg-black/70 px-4 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">
              Chat
              {messageCount > 0 ? ` · ${messageCount}` : ''}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="overflow-hidden rounded-[24px] border border-white/10 bg-black/72">
          <View className="flex-row items-center justify-between border-b border-white/10 px-4 py-2.5">
            <View>
              <Text className="text-sm font-semibold text-white">Live chat</Text>
              <Text className="mt-0.5 text-xs text-zinc-400">
                {messageCount === 0
                  ? 'Be the first to drop a message'
                  : `${messageCount} message${messageCount === 1 ? '' : 's'} in the room`}
              </Text>
            </View>
            <Pressable
              onPress={onToggle}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5"
            >
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-200">
                Hide
              </Text>
            </Pressable>
          </View>

          <View className="px-4 pt-3">
            <ScrollView
              ref={scrollRef}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
              className="max-h-[110px]"
            >
              {messageCount === 0 ? (
                <View className="pb-2">
                  <Text className="text-sm text-zinc-400">
                    Reactions, shout-outs, and questions from viewers will land here.
                  </Text>
                </View>
              ) : (
                messages.slice(-20).map((msg, index) => (
                  isReactionMessage(msg.message) ? (
                    <View
                      key={`${msg.from?.identity || 'viewer'}-${index}`}
                      className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <View className="flex-row items-center gap-3">
                        <Text className="text-2xl">{msg.message.trim()}</Text>
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
                          {msg.from?.name || msg.from?.identity || 'Viewer'}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
                        Reacted
                      </Text>
                    </View>
                  ) : (
                    <View
                      key={`${msg.from?.identity || 'viewer'}-${index}`}
                      className="mb-2 rounded-2xl bg-white/5 px-3 py-2"
                    >
                      <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-zinc-300">
                        {msg.from?.name || msg.from?.identity || 'Viewer'}
                      </Text>
                      <Text className="mt-1 text-sm leading-5 text-zinc-100">
                        {msg.message}
                      </Text>
                    </View>
                  )
                ))
              )}
            </ScrollView>

            <View className="mb-3 mt-2 flex-row items-center gap-2">
              <TextInput
                value={text}
                onChangeText={setText}
                onSubmitEditing={handleSend}
                placeholder="Say something to the room..."
                placeholderTextColor="#71717a"
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
              />
              <Pressable
                onPress={handleSend}
                disabled={!text.trim()}
                className={`rounded-full px-4 py-2.5 ${
                  text.trim() ? 'bg-red-500' : 'bg-white/10'
                }`}
              >
                <Text className="text-sm font-semibold text-white">Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function LoadingState({ venueName }: { venueName?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="absolute inset-0 bg-red-500/5" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[320px] rounded-[32px] border border-white/10 bg-zinc-900 px-6 py-8">
          <View className="mb-5 flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
              Joining live room
            </Text>
          </View>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-5 text-center text-2xl font-semibold text-zinc-100">
            {venueName ? `Connecting to ${venueName}` : 'Connecting to stream'}
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-zinc-400">
            Pulling in the live video feed and chat so you can drop straight into the room.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({
  id,
  title,
  detail,
}: {
  id?: string;
  title: string;
  detail: string;
}) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="absolute inset-0 bg-red-500/5" />
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-[340px] rounded-[32px] border border-white/10 bg-zinc-900 px-6 py-8">
          <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-400">
            Live stream unavailable
          </Text>
          <Text className="mt-4 text-3xl font-semibold text-zinc-100">{title}</Text>
          <Text className="mt-3 text-sm leading-6 text-zinc-400">{detail}</Text>

          <Pressable
            onPress={() =>
              id
                ? router.replace({ pathname: '/venues/[id]', params: { id } })
                : router.back()
            }
            className="mt-6 rounded-full bg-zinc-100 px-5 py-3"
          >
            <Text className="text-center text-sm font-semibold text-zinc-950">
              Back to venue
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="mt-3 rounded-full bg-white/5 px-5 py-3">
            <Text className="text-center text-sm font-semibold text-white">Go back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function MobileLiveWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure audio session for playback through speaker
  useEffect(() => {
    if (!AudioSession) return;

    const setupAudio = async () => {
      await AudioSession.configureAudio({
        android: {
          preferredOutputList: ['speaker', 'bluetooth', 'headset', 'earpiece'],
          audioTypeOptions: AndroidAudioTypePresets.media,
        },
        ios: {
          defaultOutput: 'speaker',
        },
      });
      await AudioSession.startAudioSession();
    };

    setupAudio();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const venueData = await fetchVenue(id);
        setVenue(venueData);

        if (!venueData.activeStreamId) {
          setError('This venue is not streaming right now.');
          return;
        }

        const streamData = await fetchStream(venueData.activeStreamId);
        setStream(streamData);

        // TODO(live-viewers): IDLE now means "host is setting up", not "stream ended".
        // Keep this temporary behavior for MVP, but split IDLE vs ENDED in the viewer UX.
        if (streamData.status !== 'LIVE') {
          setError('This stream has already ended.');
          return;
        }

        const { token: viewerToken } = await fetchViewerToken(streamData.id);
        setToken(viewerToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <LoadingState venueName={venue?.name} />;
  }

  if (error || !venue || !stream || !token) {
    return (
      <ErrorState
        id={id}
        title={error || 'Stream not available'}
        detail="The live room could not be opened right now. Jump back to the venue page and try again from there."
      />
    );
  }

  if (!LiveKitRoom) {
    return (
      <ErrorState
        id={id}
        title="Development build required"
        detail="Expo Go does not include the native LiveKit modules needed for mobile live streaming. Open the app in a development build to watch this stream."
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        style={{ flex: 1 }}
      >
        <LiveContent venue={venue} stream={stream} />
      </LiveKitRoom>
    </View>
  );
}

function LiveContent({
  venue,
  stream,
}: {
  venue: Venue;
  stream: LiveStream;
}) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [chatVisible, setChatVisible] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const nextReactionIdRef = useRef(0);
  const processedMessageCountRef = useRef(0);
  const pendingLocalReactionsRef = useRef<Array<{ emoji: string; at: number }>>([]);

  const participants = useRemoteParticipants?.() || [];
  const videoTracks =
    useTracks?.(
      [TrackSource?.Camera, TrackSource?.ScreenShare].filter(Boolean),
      { onlySubscribed: true },
    ) || [];
  const chat = useChat?.() || { chatMessages: [], send: () => {} };

  const videoTrack =
    videoTracks.find(
      (track: any) =>
        isTrackReference?.(track) &&
        !track.participant?.isLocal &&
        (track.source === TrackSource?.Camera || track.source === TrackSource?.ScreenShare),
    ) ||
    videoTracks.find((track: any) => isTrackReference?.(track));
  const viewerCount = Math.max(stream.currentViewerCount, participants.length + 1);

  const removeFloatingReaction = useCallback((id: number) => {
    setFloatingReactions((current) => current.filter((reaction) => reaction.id !== id));
  }, []);

  const launchFloatingReaction = useCallback(
    (emoji: string, source: 'local' | 'remote') => {
      const size = 46 + Math.round(Math.random() * 10);
      const safeWidth = Math.max(140, width - size - 24);
      const left =
        source === 'local'
          ? Math.max(20, Math.min(width - size - 20, width - size - 28))
          : Math.max(20, Math.min(safeWidth, 20 + Math.random() * (safeWidth - 20)));

      setFloatingReactions((current) => [
        ...current,
        {
          id: nextReactionIdRef.current++,
          emoji,
          left,
          bottom: chatVisible ? 144 : 104,
          size,
          drift: Math.random() * 56 - 28,
          duration: 1500 + Math.round(Math.random() * 500),
        },
      ]);
    },
    [chatVisible, width],
  );

  useEffect(() => {
    const messages = chat.chatMessages || [];
    const nextMessages = messages.slice(processedMessageCountRef.current);
    const now = Date.now();

    pendingLocalReactionsRef.current = pendingLocalReactionsRef.current.filter(
      (reaction) => now - reaction.at < 2500,
    );

    nextMessages.forEach((message: { message: string }) => {
      const emoji = message.message.trim();
      if (!isReactionMessage(emoji)) {
        return;
      }

      const localReactionIndex = pendingLocalReactionsRef.current.findIndex(
        (reaction) => reaction.emoji === emoji,
      );

      if (localReactionIndex >= 0) {
        pendingLocalReactionsRef.current.splice(localReactionIndex, 1);
        return;
      }

      launchFloatingReaction(emoji, 'remote');
    });

    processedMessageCountRef.current = messages.length;
  }, [chat.chatMessages, launchFloatingReaction]);

  const handleReact = (reaction: string) => {
    pendingLocalReactionsRef.current.push({ emoji: reaction, at: Date.now() });
    launchFloatingReaction(reaction, 'local');
    chat.send(reaction);
  };

  return (
    <View className="flex-1 bg-black">
      {videoTrack ? (
        <VideoTrack
          trackRef={videoTrack}
          style={{ width, height }}
          objectFit="cover"
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-zinc-950/95 px-6">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-base font-semibold text-white">
            Waiting for broadcaster...
          </Text>
          <Text className="mt-2 text-center text-sm text-zinc-400">
            The room is connected, but the host video track has not arrived yet.
          </Text>
        </View>
      )}

      <View pointerEvents="none" className="absolute inset-0 bg-black/15" />
      <FloatingReactionLayer
        reactions={floatingReactions}
        onDone={removeFloatingReaction}
      />
      <StreamEndedOverlay venueId={venue.id} venueName={venue.name} />

      <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0 z-10">
        <View className="px-4 pt-2">
          <View className="flex-row items-start justify-between gap-3">
            <Pressable
              onPress={() => router.replace({ pathname: '/venues/[id]', params: { id: venue.id } })}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60"
            >
              <Text className="text-base font-semibold text-white">←</Text>
            </Pressable>

            <View className="flex-1 rounded-[26px] border border-white/10 bg-black/55 px-4 py-3">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
                  Live now
                </Text>
                <Text className="text-[11px] uppercase tracking-[1.5px] text-zinc-400">
                  {venueTypeLabel[venue.type] ?? venue.type}
                </Text>
              </View>
              <Text className="mt-2 text-lg font-semibold text-white">{venue.name}</Text>
              <Text className="mt-1 text-xs text-zinc-300">{venue.location}</Text>
            </View>

            <ViewerCountBadge
              viewerCount={viewerCount}
              peakCount={stream.viewerPeak}
            />
          </View>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-24 right-3 z-10">
        <QuickReactionRow onReact={handleReact} vertical />
      </View>

      <ChatOverlay
        messages={chat.chatMessages}
        onSend={(message: string) => chat.send(message)}
        visible={chatVisible}
        onToggle={() => setChatVisible((current) => !current)}
      />
    </View>
  );
}
