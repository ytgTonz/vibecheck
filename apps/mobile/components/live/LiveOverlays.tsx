import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchStream, fetchVenue } from '@vibecheck/shared';

export function StreamEndedOverlay({
  venueId,
  venueName,
  streamId,
  onReconnect,
}: {
  venueId: string;
  venueName: string;
  streamId: string;
  onReconnect: () => void;
}) {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  const [newStreamAvailable, setNewStreamAvailable] = useState(false);
  const notLiveCountRef = useRef(0);
  const REQUIRED_CONFIRMATIONS = 2;

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const streamData = await fetchStream(streamId);
        if (streamData.status === 'LIVE') {
          notLiveCountRef.current = 0;
          setEnded(false);
          setNewStreamAvailable(false);
        } else {
          notLiveCountRef.current += 1;
          if (notLiveCountRef.current >= REQUIRED_CONFIRMATIONS) {
            setEnded(true);

            try {
              const venueData = await fetchVenue(venueId);
              if (venueData.activeStreamId && venueData.activeStreamId !== streamId) {
                setNewStreamAvailable(true);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Network error — don't count as ended
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [streamId, venueId]);

  if (!ended) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-30 items-center justify-center bg-black/80 px-6">
      <View className="w-full max-w-[300px] items-center">
        {/* Icon */}
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Text className="text-2xl">
            {newStreamAvailable ? '📡' : '👋'}
          </Text>
        </View>

        <Text className="text-center text-xl font-semibold text-white">
          {newStreamAvailable ? 'New stream started' : 'Stream ended'}
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-zinc-400">
          {newStreamAvailable
            ? `${venueName} just started a new live stream.`
            : `${venueName} has ended their live stream.`}
        </Text>

        {newStreamAvailable && (
          <Pressable
            onPress={onReconnect}
            className="mt-6 w-full rounded-full bg-brand-red py-3"
          >
            <Text className="text-center text-sm font-semibold text-white">
              Join new stream
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() =>
            router.replace({ pathname: '/venues/[id]', params: { id: venueId } })
          }
          className={`${newStreamAvailable ? 'mt-2' : 'mt-6'} w-full rounded-full bg-white/10 py-3`}
        >
          <Text className="text-center text-sm font-medium text-white">
            Back to venue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
