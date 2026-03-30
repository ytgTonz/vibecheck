"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchStream, fetchViewerToken, fetchVenue, LiveStream, Venue } from "@vibecheck/shared";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { ViewerCount } from "./components/ViewerCount";
import { EmojiReactions } from "./components/EmojiReactions";
import { ChatOverlay } from "./components/ChatOverlay";
import { BroadcasterVideo } from "./components/BroadcasterVideo";
import { StreamEndedOverlay } from "./components/StreamEndedOverlay";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

export default function LiveWatchPage() {
  const { id } = useParams<{ id: string }>();

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
        <div className="absolute inset-0"><BroadcasterVideo /></div>
        <RoomAudioRenderer />
        <StreamEndedOverlay venueName={venue.name} streamId={stream.id} />
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/browse" className="rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/80 backdrop-blur-sm hover:bg-black/70">
              &larr; Back
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/20 px-2.5 py-1 text-xs font-semibold text-red-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
              LIVE
            </span>
            <h1 className="text-sm font-semibold text-white drop-shadow-lg">{venue.name}</h1>
          </div>
          <ViewerCount />
        </div>
        <div className="absolute bottom-4 right-4 z-10"><EmojiReactions /></div>
        <ChatOverlay />
      </LiveKitRoom>
    </div>
  );
}
