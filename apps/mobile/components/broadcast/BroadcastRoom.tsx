import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { endStream, LiveStream, Venue } from '@vibecheck/shared';
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

export function BroadcastRoom({ venue, stream, authToken, onEnded }: BroadcastRoomProps) {
  const router = useRouter();
  const participants = useRemoteParticipants?.() || [];
  const chat = useChat?.() || { chatMessages: [], send: () => {} };
  const { localParticipant } = useLocalParticipant?.() || { localParticipant: null };
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
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

  const handleFlipCamera = async () => {
    if (!localParticipant) return;
    try {
      const publication = localParticipant.getTrackPublication(TrackSource?.Camera);
      const track = publication?.track;
      if (track && typeof track.restartTrack === 'function') {
        const nextMode = facingMode === 'user' ? 'environment' : 'user';
        await track.restartTrack({ facingMode: nextMode });
        setFacingMode(nextMode);
      }
    } catch (err) {
      console.error('[MobileBroadcast] flip camera failed:', err);
    }
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

        <View className="relative mb-4 flex-1 overflow-hidden rounded-[28px]">
          <BroadcasterPreview />
          <View className="absolute bottom-0 left-0 right-0 top-0">
            <View className="absolute left-3 right-3 top-3 flex-row items-center justify-between">
              <View className="rounded-full bg-black/50 px-3 py-1.5">
                <Text className="text-xs font-semibold text-zinc-100">
                  {participants.length} viewer{participants.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Pressable
                onPress={handleFlipCamera}
                className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
              >
                <Text className="text-base text-white">⟲</Text>
              </Pressable>
            </View>
            <LiveChatOverlay
              messages={chat.chatMessages || []}
              onSend={(msg) => chat.send?.(msg)}
            />
          </View>
        </View>

        <GoLiveOnPublish streamId={stream.id} authToken={authToken} />

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
