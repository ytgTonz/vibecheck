import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveStream, Venue } from '@vibecheck/shared';
import { LiveChatOverlay } from './LiveChatOverlay';
import {
  FloatingReaction,
  FloatingReactionLayer,
  isReactionMessage,
  QuickReactionRow,
} from './LiveReactions';
import { StreamEndedOverlay, ViewerCountBadge } from './LiveOverlays';
import {
  isTrackReference,
  TrackSource,
  useChat,
  useRemoteParticipants,
  useTracks,
  VideoTrack,
} from './livekit';

const venueTypeLabel: Record<string, string> = {
  NIGHTCLUB: 'Nightclub',
  BAR: 'Bar',
  RESTAURANT_BAR: 'Restaurant & Bar',
  LOUNGE: 'Lounge',
  SHISA_NYAMA: 'Shisa Nyama',
  ROOFTOP: 'Rooftop',
  OTHER: 'Other',
};

function LiveVideoStage({
  videoTrack,
  width,
  height,
}: {
  videoTrack: any;
  width: number;
  height: number;
}) {
  if (videoTrack) {
    return (
      <VideoTrack
        trackRef={videoTrack}
        style={{ width, height }}
        objectFit="cover"
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950/95 px-6">
      <ActivityIndicator size="large" color="#ffffff" />
      <Text className="mt-4 text-base font-semibold text-white">
        Waiting for broadcaster...
      </Text>
      <Text className="mt-2 text-center text-sm text-zinc-400">
        The room is connected, but the host video track has not arrived yet.
      </Text>
    </View>
  );
}

export function LiveRoomContent({
  venue,
  stream,
  onReconnect,
}: {
  venue: Venue;
  stream: LiveStream;
  onReconnect: () => void;
}) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const nextReactionIdRef = useRef(0);
  const processedMessageCountRef = useRef(0);
  const pendingLocalReactionsRef = useRef<Array<{ emoji: string; at: number }>>([]);

  const participants = useRemoteParticipants?.() || [];
  console.log(
    '[Mobile] remote participants:',
    participants.length,
    participants.map((p: any) => ({ identity: p.identity, tracks: p.trackPublications?.size })),
  );

  const videoTracks =
    useTracks?.(
      [TrackSource?.Camera, TrackSource?.ScreenShare].filter(Boolean),
      { onlySubscribed: true },
    ) || [];
  console.log(
    '[Mobile] useTracks result:',
    videoTracks.length,
    videoTracks.map((t: any) => ({
      source: t.source,
      isLocal: t.participant?.isLocal,
      sid: t.publication?.trackSid,
      isRef: isTrackReference?.(t),
    })),
  );

  const chat = useChat?.() || { chatMessages: [], send: () => {} };

  const videoTrack =
    videoTracks.find(
      (track: any) =>
        isTrackReference?.(track) &&
        !track.participant?.isLocal &&
        (track.source === TrackSource?.Camera || track.source === TrackSource?.ScreenShare),
    ) ||
    videoTracks.find((track: any) => isTrackReference?.(track));
  console.log(
    '[Mobile] selected videoTrack:',
    videoTrack ? { source: videoTrack.source, sid: videoTrack.publication?.trackSid } : 'NONE',
  );

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
      <LiveVideoStage videoTrack={videoTrack} width={width} height={height} />

      <View pointerEvents="none" className="absolute inset-0 bg-black/15" />
      <FloatingReactionLayer
        reactions={floatingReactions}
        onDone={removeFloatingReaction}
      />
      <StreamEndedOverlay
        venueId={venue.id}
        venueName={venue.name}
        streamId={stream.id}
        onReconnect={onReconnect}
      />

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

      <View style={{ position: 'absolute', bottom: 96 + insets.bottom, right: 12, zIndex: 10 }}>
        <QuickReactionRow onReact={handleReact} vertical />
      </View>

      <LiveChatOverlay
        messages={chat.chatMessages}
        onSend={(message: string) => chat.send(message)}
        visible={chatVisible}
        onToggle={() => setChatVisible((current) => !current)}
        bottomInset={insets.bottom}
      />
    </View>
  );
}
