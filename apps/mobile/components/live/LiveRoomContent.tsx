import { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { LiveStream, Venue } from '@vibecheck/shared';
import { LiveChatOverlay } from './LiveChatOverlay';
import { LiveHeader } from './LiveHeader';
import {
  FloatingReaction,
  FloatingReactionLayer,
  isReactionMessage,
  QuickReactionRow,
} from './LiveReactions';
import { StreamEndedOverlay } from './LiveOverlays';
import { LiveVideoStage } from './LiveVideoStage';
import {
  isTrackReference,
  TrackSource,
  useChat,
  useRemoteParticipants,
  useTracks,
} from './livekit';

export function LiveRoomContent({
  venue,
  stream,
  onReconnect,
}: {
  venue: Venue;
  stream: LiveStream;
  onReconnect: () => void;
}) {
  const { width, height } = useWindowDimensions();
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
          bottom: 148,
          size,
          drift: Math.random() * 56 - 28,
          duration: 1500 + Math.round(Math.random() * 500),
        },
      ]);
    },
    [width],
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

      {/* Subtle dim for text readability over video */}
      <View pointerEvents="none" className="absolute inset-0 bg-black/10" />

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
      <LiveHeader
        venue={venue}
        viewerCount={viewerCount}
      />

      <View style={{ position: 'absolute', bottom: 64, right: 18, zIndex: 10 }}>
        <QuickReactionRow onReact={handleReact} vertical />
      </View>

      <LiveChatOverlay
        messages={chat.chatMessages}
        onSend={(message: string) => chat.send(message)}
      />
    </View>
  );
}
