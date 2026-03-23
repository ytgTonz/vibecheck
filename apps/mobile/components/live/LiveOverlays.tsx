import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchStream, fetchVenue } from '@vibecheck/shared';

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

export function ViewerCountBadge({
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
    <View className="absolute inset-0 z-30 items-center justify-center bg-black/85 px-6">
      <View className="w-full max-w-[320px] rounded-[28px] border border-white/10 bg-zinc-950 px-6 py-7">
        <Text className="text-center text-3xl font-semibold text-white">
          {newStreamAvailable ? 'New stream started' : 'Stream ended'}
        </Text>
        <Text className="mt-3 text-center text-sm leading-6 text-zinc-400">
          {newStreamAvailable
            ? `${venueName} just started a new live stream.`
            : `${venueName} has ended their live stream.`}
        </Text>

        {newStreamAvailable ? (
          <Pressable
            onPress={onReconnect}
            className="mt-6 rounded-full bg-red-500 px-5 py-3"
          >
            <Text className="text-center text-sm font-semibold text-white">
              Join new stream
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() =>
            router.replace({ pathname: '/venues/[id]', params: { id: venueId } })
          }
          className={`${newStreamAvailable ? 'mt-3' : 'mt-6'} rounded-full bg-zinc-100 px-5 py-3`}
        >
          <Text className="text-center text-sm font-semibold text-zinc-950">
            Back to venue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
