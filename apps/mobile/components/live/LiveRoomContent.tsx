import { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveStream, Venue } from '@vibecheck/shared';
import { LiveChatOverlay } from './LiveChatOverlay';
import { LiveHeader } from './LiveHeader';
import { LiveBottomBar } from './LiveBottomBar';
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
import { LiveAttendanceBar } from './LiveAttendanceBar';

const ATTENDANCE_HEIGHT = 60;

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
  const insets = useSafeAreaInsets();
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [peakCount, setPeakCount] = useState(() =>
    Math.max(stream.viewerPeak ?? 0, stream.currentViewerCount ?? 0),
  );
  const [chatOpen, setChatOpen] = useState(false);
  const nextReactionIdRef = useRef(0);
  const processedMessageCountRef = useRef(0);
  const pendingLocalReactionsRef = useRef<Array<{ emoji: string; at: number }>>([]);
  const bottomInset = Math.max(insets.bottom, 12);
  const bottomBarHeight = 56 + bottomInset;
  const attendanceBottomOffset = bottomBarHeight + 6;

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

  const viewerCount = Math.max(stream.currentViewerCount, participants.length);

  useEffect(() => {
    setPeakCount((prevPeak) =>
      Math.max(prevPeak, stream.viewerPeak ?? 0, viewerCount),
    );
  }, [stream.viewerPeak, viewerCount]);

  const removeFloatingReaction = useCallback((id: number) => {
    setFloatingReactions((current) => current.filter((reaction) => reaction.id !== id));
  }, []);

  const layoutRef = useRef({ width, attendanceBottomOffset });
  layoutRef.current = { width, attendanceBottomOffset };

  const launchFloatingReaction = useCallback(
    (emoji: string, source: 'local' | 'remote') => {
      const { width: w, attendanceBottomOffset: abo } = layoutRef.current;
      const size = 46 + Math.round(Math.random() * 10);
      const safeWidth = Math.max(140, w - size - 24);
      const left =
        source === 'local'
          ? Math.max(20, Math.min(w - size - 20, w - size - 28))
          : Math.max(20, Math.min(safeWidth, 20 + Math.random() * (safeWidth - 20)));

      setFloatingReactions((current) => {
        if (current.length >= 12) return current;
        return [
          ...current,
          {
            id: nextReactionIdRef.current++,
            emoji,
            left,
            bottom: abo + ATTENDANCE_HEIGHT + 40,
            size,
            drift: Math.random() * 56 - 28,
            duration: 1500 + Math.round(Math.random() * 500),
          },
        ];
      });
    },
    [],
  );

  useEffect(() => {
    const messages = chat.chatMessages || [];
    const nextMessages = messages.slice(processedMessageCountRef.current);
    if (nextMessages.length === 0) {
      processedMessageCountRef.current = messages.length;
      return;
    }

    const now = Date.now();
    pendingLocalReactionsRef.current = pendingLocalReactionsRef.current.filter(
      (reaction) => now - reaction.at < 2500,
    );

    nextMessages.forEach((message: { message: string }) => {
      const emoji = message.message.trim();
      if (!isReactionMessage(emoji)) return;

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

      {/* Subtle dim for text readability */}
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

      {/* Top bar */}
      <LiveHeader venue={venue} viewerCount={viewerCount} streamId={stream.id} />

      {/* Emoji reactions — right side, above attendance */}
      <View
        style={{
          position: 'absolute',
          right: 14,
          bottom: attendanceBottomOffset + ATTENDANCE_HEIGHT + 8,
          zIndex: 10,
        }}
      >
        <QuickReactionRow onReact={handleReact} vertical />
      </View>

      {/* Chat messages — above attendance bar */}
      <LiveChatOverlay
        messages={chat.chatMessages}
        onSend={(message: string) => chat.send(message)}
        chatOpen={chatOpen}
        bottomOffset={attendanceBottomOffset + ATTENDANCE_HEIGHT + 4}
      />

      {/* Attendance row — sits above bottom bar */}
      <LiveAttendanceBar stream={stream} venue={venue} bottomOffset={attendanceBottomOffset} />

      {/* Bottom bar */}
      <LiveBottomBar
        venueId={venue.id}
        venueName={venue.name}
        chatOpen={chatOpen}
        onChatToggle={() => setChatOpen((v) => !v)}
      />
    </View>
  );
}
