"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  setBaseUrl,
  fetchStream,
  fetchViewerToken,
  fetchVenue,
  LiveStream,
  Venue,
} from "@vibecheck/shared";
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  useChat,
  useDataChannel,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
setBaseUrl(API_URL);

function ViewerCount() {
  const participants = useRemoteParticipants();
  // +1 for self
  const count = participants.length + 1;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {count} watching
    </span>
  );
}

function EmojiReactions() {
  const { send } = useDataChannel("reactions");
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);
  const nextId = useRef(0);

  const emojis = ["🔥", "❤️", "🎉", "😍", "👏"];

  useDataChannel("reactions", (msg) => {
    const emoji = new TextDecoder().decode(msg.payload);
    const id = nextId.current++;
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  });

  const sendReaction = (emoji: string) => {
    const payload = new TextEncoder().encode(emoji);
    send(payload, { reliable: false });
    // Also show locally
    const id = nextId.current++;
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Floating emojis rise above buttons */}
      <div className="pointer-events-none flex flex-col items-center gap-1">
        {floatingEmojis.map(({ id, emoji }) => (
          <span
            key={id}
            className="animate-bounce text-2xl drop-shadow-lg"
            style={{ animationDuration: "1s" }}
          >
            {emoji}
          </span>
        ))}
      </div>
      {/* Vertical emoji buttons */}
      <div className="flex flex-col gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="h-10 w-10 rounded-full bg-black/30 text-lg transition-transform hover:scale-110 hover:bg-black/50"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatOverlay() {
  const { chatMessages, send } = useChat();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    send(trimmed);
    setMessage("");
  };

  return (
    <div className="absolute bottom-0 left-0 z-10 w-1/2 max-w-md pb-4 pl-4 pr-4">
      {/* Messages — no background, text shadows for readability */}
      <div
        ref={scrollRef}
        className="mb-3 max-h-48 space-y-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chatMessages.slice(-20).map((msg, i) => (
          <p key={i} className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="font-semibold text-white">
              {msg.from?.name || msg.from?.identity || "Viewer"}
            </span>
            <span className="ml-1.5 text-white/70">{msg.message}</span>
          </p>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          className="flex-1 rounded-full bg-black/30 px-4 py-2 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="rounded-full bg-black/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/50 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function BroadcasterVideo() {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare, Track.Source.Microphone],
    { onlySubscribed: true }
  );

  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  );

  if (!videoTrack) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <p className="text-sm text-zinc-400">Waiting for broadcaster...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      className="h-full w-full object-cover"
    />
  );
}

function StreamEndedOverlay({ venueName }: { venueName: string }) {
  const room = useRoomContext();
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const handler = () => setEnded(true);
    room.on(RoomEvent.Disconnected, handler);
    return () => { room.off(RoomEvent.Disconnected, handler); };
  }, [room]);

  if (!ended) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <p className="text-xl font-semibold text-white">Stream ended</p>
        <p className="mt-2 text-sm text-zinc-400">
          {venueName} has ended their live stream
        </p>
        <Link
          href="/browse"
          className="mt-4 inline-block rounded-full bg-white px-6 py-2 text-sm font-medium text-zinc-900"
        >
          Back to browse
        </Link>
      </div>
    </div>
  );
}

export default function LiveWatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const venueData = await fetchVenue(id);
        setVenue(venueData);

        if (!venueData.activeStreamId) {
          setError("This venue is not streaming right now");
          setLoading(false);
          return;
        }

        const streamData = await fetchStream(venueData.activeStreamId);
        setStream(streamData);

        // TODO(live-viewers): IDLE now means "host is setting up", not "stream ended".
        // Keep this temporary behavior for MVP, but split IDLE vs ENDED in the viewer UX.
        if (streamData.status !== "LIVE") {
          setError("This stream has ended");
          setLoading(false);
          return;
        }

        const { token: viewerToken } = await fetchViewerToken(streamData.id);
        setToken(viewerToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stream");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-3 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <p className="text-sm text-zinc-400">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream || !token || !venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-medium text-zinc-300">
            {error || "Stream not available"}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/venues/${id}`}
              className="rounded-full bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              View venue
            </Link>
            <Link
              href="/browse"
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900"
            >
              Browse venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        className="relative h-full w-full"
      >
        {/* Fullscreen video + audio */}
        <div className="absolute inset-0">
          <BroadcasterVideo />
        </div>
        <RoomAudioRenderer />

        <StreamEndedOverlay venueName={venue.name} />

        {/* Top overlay — header */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/browse"
              className="rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm hover:bg-black/70"
            >
              &larr; Back
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              LIVE
            </span>
            <h1 className="text-sm font-semibold text-white drop-shadow-lg">
              {venue.name}
            </h1>
          </div>
          <ViewerCount />
        </div>

        {/* Right side — vertical emoji reactions */}
        <div className="absolute bottom-4 right-4 z-10">
          <EmojiReactions />
        </div>

        {/* Bottom overlay — chat */}
        <ChatOverlay />
      </LiveKitRoom>
    </div>
  );
}
