"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  setBaseUrl,
  fetchVenue,
  createStream,
  fetchStreamToken,
  endStream,
  goLiveStream,
  useAuthStore,
  LiveStream,
  Venue,
} from "@vibecheck/shared";
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  useChat,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
setBaseUrl(API_URL);

function BroadcasterPreview() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  if (!localTrack) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-900 rounded-xl">
        <p className="text-sm text-zinc-400">Camera starting...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={localTrack}
      className="h-full w-full rounded-xl object-cover"
    />
  );
}

/**
 * Invisible component that watches for the local camera track to appear
 * and calls /go-live to transition the stream from IDLE → LIVE.
 * This ensures viewers can only join once media is actually published.
 */
function GoLiveOnPublish({
  streamId,
  authToken,
}: {
  streamId: string;
  authToken: string;
}) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const firedRef = useRef(false);

  const localTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera
  );

  useEffect(() => {
    if (localTrack && !firedRef.current) {
      firedRef.current = true;
      goLiveStream(streamId, authToken).catch((err) =>
        console.error("go-live failed:", err)
      );
    }
  }, [localTrack, streamId, authToken]);

  return null;
}

function ViewerCount() {
  const participants = useRemoteParticipants();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
      </svg>
      {participants.length} viewer{participants.length !== 1 ? "s" : ""}
    </span>
  );
}

function BroadcastChat() {
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
            Chat messages from viewers will appear here
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
            placeholder="Message viewers..."
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

function LiveControls({
  stream,
  onEnd,
}: {
  stream: LiveStream;
  onEnd: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!cameraEnabled);
    setCameraEnabled(!cameraEnabled);
  };

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled(!micEnabled);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleCamera}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          cameraEnabled
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
        }`}
      >
        {cameraEnabled ? "Camera On" : "Camera Off"}
      </button>
      <button
        onClick={toggleMic}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          micEnabled
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
        }`}
      >
        {micEnabled ? "Mic On" : "Mic Off"}
      </button>
      <button
        onClick={onEnd}
        className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
      >
        End Stream
      </button>
    </div>
  );
}

export default function BroadcastPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token: authToken, hydrate } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "ended">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !authToken) {
      router.replace("/login");
      return;
    }
    if (!venueId) return;

    fetchVenue(venueId)
      .then(setVenue)
      .catch(() => setError("Failed to load venue"));
  }, [hydrated, user, authToken, venueId, router]);

  const startStream = async () => {
    if (!authToken || !venueId) return;

    setPhase("connecting");
    setError(null);

    try {
      const newStream = await createStream(venueId, authToken);
      setStream(newStream);

      const { token: broadcasterToken } = await fetchStreamToken(
        newStream.id,
        authToken
      );
      setLivekitToken(broadcasterToken);
      setPhase("live");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start stream"
      );
      setPhase("idle");
    }
  };

  const handleEndStream = async () => {
    if (!stream || !authToken) return;

    try {
      await endStream(stream.id, authToken);
      setPhase("ended");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to end stream"
      );
    }
  };

  if (!hydrated || !venue) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Stream Ended</h1>
        <p className="mt-2 text-zinc-400">
          Your live stream for {venue.name} has ended.
        </p>
        {stream && (
          <p className="mt-1 text-sm text-zinc-500">
            Peak viewers: {stream.viewerPeak}
          </p>
        )}
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-zinc-900"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (phase === "idle" || phase === "connecting") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          &larr; Dashboard
        </Link>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          <p className="mt-1 text-zinc-400">{venue.location}</p>
          <p className="mt-4 text-sm text-zinc-500">
            Start a live stream to broadcast from this venue. Your camera and
            microphone will be shared with viewers.
          </p>

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={startStream}
            disabled={phase === "connecting"}
            className="mt-6 rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {phase === "connecting" ? "Connecting..." : "Start Stream"}
          </button>
        </div>
      </div>
    );
  }

  // phase === "live"
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{venue.name}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            YOU ARE LIVE
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={livekitToken!}
        connect={true}
        video={true}
        audio={true}
        className="flex flex-col gap-4 lg:flex-row"
      >
        {/* Transition IDLE → LIVE once camera track is published */}
        <GoLiveOnPublish streamId={stream!.id} authToken={authToken!} />

        {/* Video preview */}
        <div className="relative flex-1">
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <BroadcasterPreview />
          </div>
          <div className="absolute left-4 top-4">
            <ViewerCount />
          </div>
          <div className="mt-4">
            <LiveControls stream={stream!} onEnd={handleEndStream} />
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-[500px] w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 lg:h-auto lg:w-80">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-semibold">Live Chat</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <BroadcastChat />
          </div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
