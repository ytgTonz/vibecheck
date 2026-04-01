import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { endStream, LiveStream, useSocket, Venue } from '@vibecheck/shared';
import type { StreamEvent } from '@vibecheck/shared';
import {
  TrackSource,
  useChat,
  useLocalParticipant,
  useRemoteParticipants,
} from '@/components/live/livekit';
import { LiveChatOverlay } from '@/components/live/LiveChatOverlay';
import { BroadcasterPreview } from './BroadcasterPreview';
import { GoLiveOnPublish } from './GoLiveOnPublish';

interface BroadcastRoomProps {
  venue: Venue;
  stream: LiveStream;
  authToken: string;
  onEnded: () => void;
}

function formatElapsed(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BroadcastRoom({ venue, stream, authToken, onEnded }: BroadcastRoomProps) {
  const participants = useRemoteParticipants?.() || [];
  const chat = useChat?.() || { chatMessages: [], send: () => {} };
  const { localParticipant } = useLocalParticipant?.() || { localParticipant: null };
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intentCount, setIntentCount] = useState(0);
  const [arrivalCount, setArrivalCount] = useState(0);

  // Publish camera + mic tracks on mount (permissions already granted in setup)
  useEffect(() => {
    if (!localParticipant) return;
    localParticipant.setCameraEnabled(true);
    localParticipant.setMicrophoneEnabled(true);
  }, [localParticipant]);

  useEffect(() => {
    const start = stream.startedAt ? new Date(stream.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.startedAt]);

  useSocket({
    'stream:ended': useCallback((data: StreamEvent) => {
      if (data.streamId === stream.id) onEnded();
    }, [stream.id, onEnded]),
    'attendance:update': useCallback((data: any) => {
      if (data.streamId === stream.id) {
        setIntentCount(data.intentCount);
        setArrivalCount(data.arrivalCount);
      }
    }, [stream.id]),
  });

  const handleToggleCamera = async () => {
    if (!localParticipant) return;
    const next = !cameraEnabled;
    await localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
  };

  const handleToggleMic = async () => {
    if (!localParticipant) return;
    const next = !micEnabled;
    await localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  };

  const handleFlipCamera = async () => {
    if (!localParticipant) return;
    try {
      const publication = localParticipant.getTrackPublication(TrackSource?.Camera);
      const track = publication?.track;
      if (track && typeof track.restartTrack === 'function') {
        const next = facingMode === 'user' ? 'environment' : 'user';
        await track.restartTrack({ facingMode: next });
        setFacingMode(next);
      }
    } catch (err) {
      if (__DEV__) console.error('[MobileBroadcast] flip camera failed:', err);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endStream(stream.id, authToken);
      onEnded();
    } catch (err) {
      if (__DEV__) console.error('[MobileBroadcast] end stream failed:', err);
      setEnding(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 px-4 pt-3 pb-4 gap-3">
        {/* Status bar: LIVE badge + timer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 rounded-xl bg-brand-red px-4 py-2">
            <View className="w-2.5 h-2.5 rounded-full bg-white" />
            <Text className="text-sm font-semibold text-white">LIVE</Text>
          </View>
          <View className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2">
            <Text className="text-sm font-semibold text-zinc-100 tabular-nums">
              {formatElapsed(elapsed)}
            </Text>
          </View>
        </View>

        {/* Camera preview */}
        <View className="relative flex-1 overflow-hidden rounded-[24px] bg-zinc-900">
          <BroadcasterPreview />
          <View className="absolute inset-0">
            <View className="absolute left-3 right-3 top-3 flex-row items-center justify-between">
              <Pressable
                onPress={handleFlipCamera}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
              >
                <Ionicons name="camera-reverse-outline" size={18} color="white" />
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleToggleCamera}
                  className={`h-9 w-9 items-center justify-center rounded-full ${cameraEnabled ? 'bg-black/50' : 'bg-brand-red/80'}`}
                >
                  <Ionicons
                    name={cameraEnabled ? 'camera-outline' : 'camera-off-outline'}
                    size={17}
                    color="white"
                  />
                </Pressable>
                <Pressable
                  onPress={handleToggleMic}
                  className={`h-9 w-9 items-center justify-center rounded-full ${micEnabled ? 'bg-black/50' : 'bg-brand-red/80'}`}
                >
                  <Ionicons
                    name={micEnabled ? 'mic-outline' : 'mic-off-outline'}
                    size={17}
                    color="white"
                  />
                </Pressable>
              </View>
            </View>
            <LiveChatOverlay
              messages={chat.chatMessages || []}
              onSend={(msg) => chat.send?.(msg)}
            />
          </View>
        </View>

        <GoLiveOnPublish streamId={stream.id} authToken={authToken} />

        {/* Stats grid */}
        <View className="flex-row gap-3">
          {[
            { value: participants.length, label: 'VIEWERS' },
            { value: intentCount, label: 'COMING' },
            { value: arrivalCount, label: 'ARRIVED' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 py-5 items-center">
              <Text className="text-3xl font-semibold text-zinc-100">{stat.value}</Text>
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mt-1.5">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Peak + quality row */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Peak viewers
            </Text>
            <Text className="text-2xl font-semibold text-zinc-100 mt-1.5">
              {stream.viewerPeak}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Stream quality
            </Text>
            <Text className="text-2xl font-semibold text-green-400 mt-1.5">Good</Text>
          </View>
        </View>

        {/* End stream */}
        <Pressable
          onPress={handleEnd}
          disabled={ending}
          className="rounded-[20px] bg-zinc-800 border border-zinc-700 py-5"
          style={{ opacity: ending ? 0.6 : 1 }}
        >
          <Text className="text-center text-[17px] font-semibold text-zinc-100">
            {ending ? 'Ending…' : 'End stream'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
