import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  setBaseUrl,
  fetchVenue,
  fetchStream,
  fetchViewerToken,
  Venue,
  LiveStream,
} from '@vibecheck/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';
setBaseUrl(API_URL);

// LiveKit React Native imports
let LiveKitRoom: any;
let VideoTrack: any;
let useRemoteParticipants: any;
let useTracks: any;
let useChat: any;
let TrackSource: any;

try {
  const lkComponents = require('@livekit/react-native');
  LiveKitRoom = lkComponents.LiveKitRoom;
  VideoTrack = lkComponents.VideoTrack;
  useRemoteParticipants = lkComponents.useRemoteParticipants;
  useTracks = lkComponents.useTracks;
  useChat = lkComponents.useChat;
  const lkClient = require('livekit-client');
  TrackSource = lkClient.Track?.Source;
} catch {
  // LiveKit native modules may not be available in Expo Go
}

function ViewerCountBadge({ count }: { count: number }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-black/50 px-3 py-1">
      <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
      <Text className="text-xs font-medium text-white">{count} watching</Text>
    </View>
  );
}

function ChatOverlay({
  messages,
  onSend,
}: {
  messages: { from?: { name?: string; identity?: string }; message: string }[];
  onSend: (msg: string) => void;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="absolute bottom-0 left-0 right-0"
    >
      <View className="max-h-[200px] px-4 pb-2">
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          className="mb-2"
        >
          {messages.slice(-20).map((msg, i) => (
            <View key={i} className="mb-1 flex-row flex-wrap">
              <Text className="text-xs font-semibold text-white/80">
                {msg.from?.name || msg.from?.identity || 'Viewer'}
              </Text>
              <Text className="ml-1.5 text-xs text-white/60">{msg.message}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            placeholder="Say something..."
            placeholderTextColor="#71717a"
            className="flex-1 rounded-full bg-black/50 px-4 py-2 text-sm text-white"
          />
          <Pressable
            onPress={handleSend}
            className="rounded-full bg-white/20 px-4 py-2"
          >
            <Text className="text-sm font-medium text-white">Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MobileLiveWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const venueData = await fetchVenue(id);
        setVenue(venueData);

        if (!venueData.activeStreamId) {
          setError('This venue is not streaming right now');
          setLoading(false);
          return;
        }

        const streamData = await fetchStream(venueData.activeStreamId);
        setStream(streamData);

        if (streamData.status !== 'LIVE') {
          setError('This stream has ended');
          setLoading(false);
          return;
        }

        const { token: viewerToken } = await fetchViewerToken(streamData.id);
        setToken(viewerToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="mt-3 text-sm text-zinc-400">Connecting to stream...</Text>
      </SafeAreaView>
    );
  }

  if (error || !venue || !stream || !token) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-950 px-4">
        <Text className="text-lg font-medium text-zinc-300">
          {error || 'Stream not available'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-full bg-zinc-800 px-6 py-3"
        >
          <Text className="text-sm font-medium text-white">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // If LiveKit native components aren't available (Expo Go), show a message
  if (!LiveKitRoom) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-zinc-950 px-6">
        <Text className="text-center text-lg font-medium text-zinc-300">
          Live streaming requires a development build
        </Text>
        <Text className="mt-2 text-center text-sm text-zinc-500">
          LiveKit native modules are not available in Expo Go. Please use a
          development build to watch live streams.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-full bg-zinc-800 px-6 py-3"
        >
          <Text className="text-sm font-medium text-white">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* LiveKit Room - fullscreen video with chat overlay */}
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        style={{ flex: 1 }}
      >
        <LiveContent venue={venue} />
      </LiveKitRoom>
    </View>
  );
}

function LiveContent({ venue }: { venue: Venue }) {
  const router = useRouter();
  // Use LiveKit hooks inside LiveKitRoom context
  const participants = useRemoteParticipants?.() || [];
  const tracks = useTracks?.(
    [TrackSource?.Camera, TrackSource?.ScreenShare].filter(Boolean),
    { onlySubscribed: true }
  ) || [];
  const chat = useChat?.() || { chatMessages: [], send: () => {} };

  const videoTrack = tracks.find(
    (t: any) =>
      t.source === TrackSource?.Camera ||
      t.source === TrackSource?.ScreenShare
  );

  const screenDims = Dimensions.get('window');

  return (
    <View className="flex-1">
      {/* Header overlay */}
      <SafeAreaView
        edges={['top']}
        className="absolute left-0 right-0 top-0 z-10"
      >
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable onPress={() => router.back()}>
            <Text className="text-sm font-medium text-white/80">&larr; Back</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <Text className="text-xs font-semibold text-red-400">LIVE</Text>
            </View>
            <Text className="text-sm font-semibold text-white">
              {venue.name}
            </Text>
          </View>
          <ViewerCountBadge count={participants.length} />
        </View>
      </SafeAreaView>

      {videoTrack ? (
        <VideoTrack
          trackRef={videoTrack}
          style={{ width: screenDims.width, height: screenDims.height }}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-zinc-900">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="mt-3 text-sm text-zinc-400">
            Waiting for broadcaster...
          </Text>
        </View>
      )}

      {/* Chat overlay */}
      <ChatOverlay
        messages={chat.chatMessages}
        onSend={(msg: string) => chat.send(msg)}
      />
    </View>
  );
}
