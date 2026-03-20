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
    <div className="relative">
      {/* Floating emojis */}
      <div className="pointer-events-none absolute -top-20 right-0 flex flex-col items-end gap-1">
        {floatingEmojis.map(({ id, emoji }) => (
          <span
            key={id}
            className="animate-bounce text-2xl"
            style={{ animationDuration: "1s" }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="rounded-full bg-white/10 px-3 py-1.5 text-lg transition-transform hover:scale-110 hover:bg-white/20"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatPanel() {
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
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin]"
      >
        {chatMessages.length === 0 && (
          <p className="text-center text-xs text-zinc-500">
            Chat messages appear here
          </p>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-zinc-300">
              {msg.from?.name || msg.from?.identity || "Viewer"}
            </span>
            <span className="ml-2 text-zinc-400">{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function BroadcasterVideo() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });

  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  );

  if (!videoTrack) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-900">
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
      className="h-full w-full object-contain"
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
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            &larr; Browse
          </Link>
          <span className="text-zinc-600">|</span>
          <h1 className="text-lg font-semibold">{venue.name}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE
          </span>
        </div>
      </div>

      {/* Main content */}
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        className="flex flex-col gap-4 lg:flex-row"
      >
        {/* Video */}
        <div className="relative flex-1 overflow-hidden rounded-xl bg-black">
          <div className="aspect-video">
            <BroadcasterVideo />
          </div>
          <StreamEndedOverlay venueName={venue.name} />

          {/* Overlay controls */}
          <div className="absolute left-4 top-4">
            <ViewerCount />
          </div>
        </div>

        {/* Sidebar — chat + reactions */}
        <div className="flex h-[500px] w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 lg:h-auto lg:w-80">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-semibold">Live Chat</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel />
          </div>
          <div className="border-t border-zinc-800 p-3">
            <EmojiReactions />
          </div>
        </div>
      </LiveKitRoom>

      {/* Venue info */}
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">{venue.location}</p>
            {venue.musicGenre.length > 0 && (
              <div className="mt-2 flex gap-2">
                {venue.musicGenre.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            href={`/venues/${venue.id}`}
            className="text-sm text-zinc-400 hover:text-white"
          >
            View venue &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
