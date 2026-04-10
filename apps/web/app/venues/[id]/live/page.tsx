"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchStream, fetchViewerToken, fetchVenue, LiveStream, useAuthStore, Venue } from "@vibecheck/shared";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { EmojiReactions } from "./components/EmojiReactions";
import { ChatOverlay } from "./components/ChatOverlay";
import { BroadcasterVideo } from "./components/BroadcasterVideo";
import { StreamEndedOverlay } from "./components/StreamEndedOverlay";
import { AttendanceBar } from "./components/AttendanceBar";
import { BottomBar } from "./components/BottomBar";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

function formatViewerCount(count: number): string {
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return String(count);
}

export default function LiveWatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const authToken = useAuthStore((s) => s.token);

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
        if (streamData.status !== "LIVE") {
          setError("This stream has ended");
          setLoading(false);
          return;
        }

        const { token: viewerToken } = await fetchViewerToken(streamData.id, authToken ?? undefined);
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
          <p className="text-lg font-medium text-zinc-300">{error || "Stream not available"}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href={`/venues/${id}`} className="rounded-full bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700">
              View venue
            </Link>
            <Link href="/browse" className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900">
              Browse venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <LiveKitRoom serverUrl={LIVEKIT_URL} token={token} connect={true} className="relative h-full w-full">
        {/* Video background */}
        <div className="absolute inset-0">
          <BroadcasterVideo />
        </div>
        <RoomAudioRenderer />
        <StreamEndedOverlay venueName={venue.name} streamId={stream.id} />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-3 pb-2">
          {/* Row 1: back + actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: venue.name, url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label="Share stream"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
              <button
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Row 2: stream info */}
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red px-2.5 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-sm font-bold text-white drop-shadow-lg">{venue.name}</h1>
                {/* Verified badge */}
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-brand-red" aria-label="Verified">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
              <p className="text-xs text-white/70">{formatViewerCount(viewerCount)} watching</p>
            </div>
          </div>
        </div>

        {/* Emoji reactions — right side, above attendance */}
        <div className="absolute right-3 z-10" style={{ bottom: "14rem" }}>
          <EmojiReactions />
        </div>

        {/* Chat messages — bottom-left, above attendance */}
        <div className="absolute left-0 z-10 w-full sm:w-1/2 sm:max-w-md" style={{ bottom: "9.5rem" }}>
          <ChatOverlay chatOpen={chatOpen} onViewerCount={setViewerCount} />
        </div>

        {/* Attendance bar — above bottom bar */}
        <div className="absolute inset-x-0 z-10" style={{ bottom: "4rem" }}>
          <AttendanceBar
            streamId={stream.id}
            initialIntentCount={venue.intentCount}
            initialArrivalCount={venue.arrivalCount}
          />
        </div>

        {/* Bottom bar */}
        <div className="absolute inset-x-0 bottom-0 z-20">
          <BottomBar
            venueName={venue.name}
            chatOpen={chatOpen}
            onChatToggle={() => setChatOpen((v) => !v)}
          />
        </div>
      </LiveKitRoom>
    </div>
  );
}
