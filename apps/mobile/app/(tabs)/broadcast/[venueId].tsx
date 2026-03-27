import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  createStream,
  fetchStream,
  fetchStreamToken,
  fetchVenue,
  LiveStream,
  useAuthStore,
  useBroadcastStore,
  Venue,
} from '@vibecheck/shared';
import {
  AndroidAudioTypePresets,
  AudioSession,
  LiveKitRoom,
} from '@/components/live/livekit';
import { ErrorState, LoadingState } from '@/components/live/LiveStates';
import { BroadcastRoom } from '@/components/broadcast/BroadcastRoom';
import { BroadcastSetupScreen } from '@/components/broadcast/BroadcastSetupScreen';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

export default function MobileBroadcastScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token: authToken, hydrate } = useAuthStore();
  const { setBroadcast, clearBroadcast } = useBroadcastStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'setup' | 'connecting' | 'live'>('setup');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!AudioSession) return;
    const setupAudio = async () => {
      await AudioSession.configureAudio({
        android: {
          preferredOutputList: ['speaker', 'bluetooth', 'headset', 'earpiece'],
          audioTypeOptions: AndroidAudioTypePresets.communication,
        },
        ios: { defaultOutput: 'speaker' },
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

  if (loading) return <LoadingState venueName={venue?.name} />;

  if (error && !venue) {
    return <ErrorState id={venueId} title="Broadcast unavailable" detail={error} />;
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
      <BroadcastSetupScreen
        venue={venue}
        stream={stream}
        phase={phase as 'setup' | 'connecting'}
        error={error}
        onStart={startStream}
      />
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
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
