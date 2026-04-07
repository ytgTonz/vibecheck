import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { fetchStream, fetchVenue, fetchViewerToken, LiveStream, useAuthStore, Venue } from '@vibecheck/shared';
import { ErrorState, LoadingState } from '@/components/live/LiveStates';
import { useNetwork } from '@/contexts/NetworkContext';
import { LiveAuthGate } from '@/components/live/LiveAuthGate';
import { LiveRoomContent } from '@/components/live/LiveRoomContent';
import {
  AndroidAudioTypePresets,
  AudioSession,
  LiveKitRoom,
} from '@/components/live/livekit';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || '';

export default function MobileLiveWatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isConnected, didReconnect, clearReconnect } = useNetwork();

  // Auto-retry when connectivity returns after an error
  useEffect(() => {
    if (didReconnect && error) {
      setRetryCount((c) => c + 1);
      clearReconnect();
    }
  }, [didReconnect, clearReconnect, error]);

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
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setStream(null);
      setToken(null);

      try {
        const venueData = await fetchVenue(id);
        if (cancelled) return;
        setVenue(venueData);

        if (!venueData.activeStreamId) {
          setError('This venue is not streaming right now.');
          return;
        }

        let streamData: LiveStream | null = null;
        const MAX_RETRIES = 5;
        const RETRY_DELAY = 2000;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          if (cancelled) return;
          try {
            streamData = await fetchStream(venueData.activeStreamId);
            if (__DEV__) console.log(`[Mobile] stream fetched (attempt ${attempt + 1}):`, streamData.id, 'status:', streamData.status);
            if (streamData.status === 'LIVE') break;
            streamData = null;
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY));
            }
          } catch (fetchErr) {
            if (__DEV__) console.log(`[Mobile] stream fetch attempt ${attempt + 1} failed:`, fetchErr);
            streamData = null;
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY));
            }
          }
        }

        if (cancelled) return;

        if (!streamData || streamData.status !== 'LIVE') {
          setError('This stream is not available right now. It may still be starting up — try again in a moment.');
          return;
        }

        setStream(streamData);

        let viewerToken: string | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          if (cancelled) return;
          try {
            const result = await fetchViewerToken(streamData.id);
            viewerToken = result.token;
            break;
          } catch (tokenErr) {
            if (__DEV__) console.log(`[Mobile] viewer token attempt ${attempt + 1} failed:`, tokenErr);
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY));
            }
          }
        }

        if (cancelled) return;

        if (!viewerToken) {
          setError('Could not get a viewer token. The stream may have just ended — try again.');
          return;
        }

        if (__DEV__) console.log('[Mobile] viewer token received for stream:', streamData.id);
        setToken(viewerToken);
      } catch (err) {
        if (!cancelled) {
          if (__DEV__) console.log('[Mobile] live screen error:', err);
          setError(err instanceof Error ? err.message : 'Failed to load stream.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, retryCount]);

  // Gate: guests cannot watch live streams
  if (hydrated && !user) {
    return (
      <LiveAuthGate
        onSignIn={() => router.push('/login')}
        onCreateAccount={() => router.push('/(tabs)/(auth)/viewer-register' as never)}
      />
    );
  }

  if (loading) {
    return <LoadingState venueName={venue?.name} />;
  }

  if (error || !venue || !stream || !token) {
    return (
      <ErrorState
        id={id}
        title={!isConnected ? "You're offline" : (error || 'Stream not available')}
        detail={
          !isConnected
            ? "The live stream needs an internet connection. We'll reconnect automatically when you're back online."
            : 'The live room could not be opened right now. Jump back to the venue page and try again from there.'
        }
        onRetry={isConnected ? () => setRetryCount((count) => count + 1) : undefined}
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
    <SafeAreaView className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        style={{ flex: 1 }}
      >
        <LiveRoomContent
          venue={venue}
          stream={stream}
          onReconnect={() => setRetryCount((count) => count + 1)}
        />
      </LiveKitRoom>
    </SafeAreaView>
  );
}
