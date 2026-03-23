import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  createStream,
  endStream,
  fetchStream,
  fetchStreamToken,
  fetchVenue,
  goLiveStream,
  LiveStream,
  Venue,
  useAuthStore,
  useBroadcastStore,
} from '@vibecheck/shared';
import {
  AndroidAudioTypePresets,
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  TrackSource,
  useChat,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
} from '@/components/live/livekit';
import { ErrorState, LoadingState } from '@/components/live/LiveStates';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

function BroadcasterPreview() {
  const tracks =
    useTracks?.([TrackSource?.Camera].filter(Boolean), { onlySubscribed: false }) || [];
  const localTrack = tracks.find(
    (track: any) =>
      isTrackReference?.(track) &&
      track.participant?.isLocal &&
      track.source === TrackSource?.Camera,
  );

  if (!localTrack) {
    return (
      <View className="flex-1 items-center justify-center rounded-[28px] border border-white/10 bg-zinc-950">
        <ActivityIndicator color="#f4f4f5" />
        <Text className="mt-3 text-sm text-zinc-400">Camera starting...</Text>
      </View>
    );
  }

  return (
    <VideoTrack
      trackRef={localTrack}
      style={{ width: '100%', height: '100%' }}
      objectFit="cover"
    />
  );
}

function GoLiveOnPublish({
  streamId,
  authToken,
}: {
  streamId: string;
  authToken: string;
}) {
  const tracks =
    useTracks?.([TrackSource?.Camera].filter(Boolean), { onlySubscribed: false }) || [];
  const firedRef = useRef(false);
  const localTrack = tracks.find(
    (track: any) =>
      isTrackReference?.(track) &&
      track.participant?.isLocal &&
      track.source === TrackSource?.Camera,
  );

  useEffect(() => {
    if (localTrack && !firedRef.current) {
      firedRef.current = true;
      goLiveStream(streamId, authToken).catch((err) => {
        console.error('[MobileBroadcast] go-live failed:', err);
      });
    }
  }, [authToken, localTrack, streamId]);

  return null;
}

function BroadcastRoom({
  venue,
  stream,
  authToken,
  onEnded,
}: {
  venue: Venue;
  stream: LiveStream;
  authToken: string;
  onEnded: () => void;
}) {
  const router = useRouter();
  const participants = useRemoteParticipants?.() || [];
  const chat = useChat?.() || { chatMessages: [] };
  const { localParticipant } = useLocalParticipant?.() || { localParticipant: null };
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [ending, setEnding] = useState(false);

  const handleToggleCamera = async () => {
    if (!localParticipant) return;
    const nextValue = !cameraEnabled;
    await localParticipant.setCameraEnabled(nextValue);
    setCameraEnabled(nextValue);
  };

  const handleToggleMic = async () => {
    if (!localParticipant) return;
    const nextValue = !micEnabled;
    await localParticipant.setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endStream(stream.id, authToken);
      onEnded();
    } catch (err) {
      console.error('[MobileBroadcast] end stream failed:', err);
      setEnding(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 px-4 pb-4 pt-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.replace('/dashboard')}
            className="rounded-full border border-white/10 bg-black/50 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">Close</Text>
          </Pressable>
          <View className="rounded-full bg-red-500/20 px-3 py-1.5">
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-red-300">
              You are live
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-2xl font-semibold text-zinc-100">{venue.name}</Text>
          <Text className="mt-1 text-sm text-zinc-400">{venue.location}</Text>
        </View>

        <View className="mb-4 h-[420px] overflow-hidden rounded-[28px]">
          <BroadcasterPreview />
        </View>

        <GoLiveOnPublish streamId={stream.id} authToken={authToken} />

        <View className="mb-4 flex-row flex-wrap gap-3">
          <View className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
            <Text className="text-sm text-zinc-100">
              {participants.length} viewer{participants.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2">
            <Text className="text-sm text-zinc-100">
              {chat.chatMessages?.length || 0} chat
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={handleToggleCamera}
            className={`flex-1 rounded-2xl px-4 py-3 ${cameraEnabled ? 'bg-zinc-900' : 'bg-red-500/20'}`}
          >
            <Text className={`text-center text-sm font-semibold ${cameraEnabled ? 'text-zinc-100' : 'text-red-300'}`}>
              {cameraEnabled ? 'Camera On' : 'Camera Off'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleToggleMic}
            className={`flex-1 rounded-2xl px-4 py-3 ${micEnabled ? 'bg-zinc-900' : 'bg-red-500/20'}`}
          >
            <Text className={`text-center text-sm font-semibold ${micEnabled ? 'text-zinc-100' : 'text-red-300'}`}>
              {micEnabled ? 'Mic On' : 'Mic Off'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleEnd}
          disabled={ending}
          className="mt-3 rounded-2xl bg-red-500 px-4 py-3"
        >
          <Text className="text-center text-sm font-semibold text-white">
            {ending ? 'Ending...' : 'End Stream'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function MobileBroadcastScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token: authToken, hydrate } = useAuthStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'setup' | 'connecting' | 'live'>('setup');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!AudioSession) return;

    const setupAudio = async () => {
      await AudioSession.configureAudio({
        android: {
          preferredOutputList: ['speaker', 'bluetooth', 'headset', 'earpiece'],
          audioTypeOptions: AndroidAudioTypePresets.communication,
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
    if (!venueId || !authToken) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const venueData = await fetchVenue(venueId);
        if (cancelled) return;
        setVenue(venueData);

        if (venueData.activeStreamId) {
          const activeStream = await fetchStream(venueData.activeStreamId);
          if (cancelled) return;
          if (activeStream.status === 'LIVE') {
            setStream(activeStream);
            try {
              const { token: broadcasterToken } = await fetchStreamToken(activeStream.id, authToken);
              if (cancelled) return;
              setLivekitToken(broadcasterToken);
              setPhase('live');
              setBroadcast(venueId, activeStream.id, venueData.name, broadcasterToken);
            } catch {
              setPhase('setup');
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load broadcast setup.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, venueId]);

  const { setBroadcast, clearBroadcast } = useBroadcastStore();

  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );

  const startStream = async () => {
    if (!authToken || !venueId) return;
    setError(null);
    setPhase('connecting');

    try {
      const newStream = await createStream(venueId, authToken);
      setStream(newStream);

      const { token: broadcasterToken } = await fetchStreamToken(newStream.id, authToken);
      setLivekitToken(broadcasterToken);
      setPhase('live');
      setBroadcast(venueId, newStream.id, venue?.name || '', broadcasterToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start stream.');
      setPhase('setup');
    }
  };

  if (loading) {
    return <LoadingState venueName={venue?.name} />;
  }

  if (error && !venue) {
    return (
      <ErrorState
        id={venueId}
        title="Broadcast unavailable"
        detail={error}
      />
    );
  }

  if (!user || !authToken || !canBroadcast) {
    return (
      <ErrorState
        id={venueId}
        title="Sign in required"
        detail="Only venue owners and promoters can start a mobile live stream."
      />
    );
  }

  if (!LiveKitRoom) {
    return (
      <ErrorState
        id={venueId}
        title="Development build required"
        detail="Expo Go does not include the native LiveKit modules needed for mobile broadcasting."
      />
    );
  }

  if (!venue) {
    return (
      <ErrorState
        id={venueId}
        title="Venue not found"
        detail="The selected venue could not be loaded."
      />
    );
  }

  if (phase !== 'live' || !stream || !livekitToken) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 px-5 py-4">
          <Pressable
            onPress={() => router.replace('/upload')}
            className="mb-6 self-start rounded-full border border-zinc-800 px-4 py-2"
          >
            <Text className="text-sm font-semibold text-zinc-300">Back</Text>
          </Pressable>

          <View className="rounded-[32px] border border-zinc-800 bg-zinc-900 px-6 py-7">
            <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-red-300">
              Go Live
            </Text>
            <Text className="mt-4 text-3xl font-semibold text-zinc-100">{venue.name}</Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-400">
              Start broadcasting from this venue with your camera and microphone.
            </Text>

            {error ? (
              <Text className="mt-4 text-sm text-red-400">{error}</Text>
            ) : null}

            {stream?.status === 'LIVE' && !livekitToken ? (
              <View className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
                <Text className="text-sm font-semibold text-zinc-100">This venue is already live</Text>
                <Text className="mt-2 text-sm leading-6 text-zinc-400">
                  Another team member may be running this stream right now.
                </Text>
                <Pressable
                  onPress={() => router.replace('/upload')}
                  className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3"
                >
                  <Text className="text-center text-sm font-semibold text-zinc-950">
                    Back to dashboard
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={startStream}
                disabled={phase === 'connecting'}
                className="mt-6 rounded-[24px] bg-red-500 px-5 py-4"
              >
                <Text className="text-center text-base font-semibold text-white">
                  {phase === 'connecting' ? 'Connecting...' : 'Start Stream'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={livekitToken}
        connect={true}
        audio={true}
        video={true}
        style={{ flex: 1 }}
      >
        <BroadcastRoom
          venue={venue}
          stream={stream}
          authToken={authToken}
          onEnded={() => {
            clearBroadcast();
            setStream(null);
            setLivekitToken(null);
            setError(null);
            setPhase('setup');
            router.replace('/upload');
          }}
        />
      </LiveKitRoom>
    </View>
  );
}
