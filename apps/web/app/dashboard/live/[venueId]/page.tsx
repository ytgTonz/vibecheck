"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchVenue,
  createStream,
  fetchStreamToken,
  fetchViewerToken,
  fetchAttendanceCounts,
  endStream,
  useAuthStore,
  useBroadcastStore,
  useSocket,
  LiveStream,
  Venue,
  AttendanceUpdateEvent,
} from "@vibecheck/shared";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { BroadcasterPreview } from "./components/BroadcasterPreview";
import { GoLiveOnPublish } from "./components/GoLiveOnPublish";
import { ViewerCount } from "./components/ViewerCount";
import { BroadcastChat } from "./components/BroadcastChat";
import { LiveControls } from "./components/LiveControls";
import { RemoteVideo } from "./components/RemoteVideo";

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

export default function BroadcastPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token: authToken, hydrate } = useAuthStore();
  const broadcastStore = useBroadcastStore();
  const [hydrated, setHydrated] = useState(false);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "monitoring" | "ended">("idle");
  const [error, setError] = useState<string | null>(null);
  const [attendanceCounts, setAttendanceCounts] = useState({ intentCount: 0, arrivalCount: 0 });

  useEffect(() => {
    if (!stream?.id || (phase !== "live" && phase !== "monitoring")) return;
    fetchAttendanceCounts(stream.id)
      .then(setAttendanceCounts)
      .catch(() => {});
  }, [stream?.id, phase]);

  const handleAttendanceUpdate = useCallback(
    (data: AttendanceUpdateEvent) => {
      if (data.streamId === stream?.id) {
        setAttendanceCounts({ intentCount: data.intentCount, arrivalCount: data.arrivalCount });
      }
    },
    [stream?.id],
  );

  useSocket({ "attendance:update": handleAttendanceUpdate });

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !venueId) return;
    const bs = useBroadcastStore.getState();
    if (bs.venueId === venueId && bs.livekitToken && bs.streamId) {
      setLivekitToken(bs.livekitToken);
      setStream({ id: bs.streamId } as LiveStream);
      setPhase("live");
    }
  }, [hydrated, venueId]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !authToken) { router.replace("/login"); return; }
    if (!venueId) return;

    fetchVenue(venueId)
      .then(async (v) => {
        setVenue(v);
        if (v.isLive && v.activeStreamId && v.ownerId === user.id) {
          const bs = useBroadcastStore.getState();
          if (bs.venueId === venueId && bs.streamId === v.activeStreamId) return;
          try {
            const { token: viewerToken } = await fetchViewerToken(v.activeStreamId);
            setStream({ id: v.activeStreamId } as LiveStream);
            setLivekitToken(viewerToken);
            setPhase("monitoring");
          } catch {
            setError("Failed to connect to stream");
          }
        }
      })
      .catch(() => setError("Failed to load venue"));
  }, [hydrated, user, authToken, venueId, router]);

  const startStream = async () => {
    if (!authToken || !venueId) return;
    setPhase("connecting");
    setError(null);
    try {
      const newStream = await createStream(venueId, authToken);
      console.log('[Broadcast] stream created:', newStream.id, 'status:', newStream.status);
      setStream(newStream);
      const { token: broadcasterToken } = await fetchStreamToken(newStream.id, authToken);
      console.log('[Broadcast] broadcaster token received, joining room');
      setLivekitToken(broadcasterToken);
      setPhase("live");
      if (venue) broadcastStore.setBroadcast(venueId!, newStream.id, venue.name, broadcasterToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start stream");
      setPhase("idle");
    }
  };

  const handleEndStream = async () => {
    if (!stream || !authToken) return;
    try {
      await endStream(stream.id, authToken);
      broadcastStore.clearBroadcast();
      setPhase("ended");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end stream");
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
        <p className="mt-2 text-zinc-400">Your live stream for {venue.name} has ended.</p>
        {stream && <p className="mt-1 text-sm text-zinc-500">Peak viewers: {stream.viewerPeak}</p>}
        <Link href="/dashboard" className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-zinc-900">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (phase === "idle" || phase === "connecting") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
          &larr; Dashboard
        </Link>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          <p className="mt-1 text-zinc-400">{venue.location}</p>
          <p className="mt-4 text-sm text-zinc-500">
            Start a live stream to broadcast from this venue. Your camera and microphone will be shared with viewers.
          </p>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <button
            onClick={startStream}
            disabled={phase === "connecting"}
            className="mt-6 rounded-full bg-brand-red px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90 disabled:opacity-50"
          >
            {phase === "connecting" ? "Connecting..." : "Start Stream"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "monitoring" && livekitToken && stream) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200">&larr; Dashboard</Link>
            <h1 className="text-lg font-semibold">{venue.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
              LIVE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{attendanceCounts.intentCount} coming</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{attendanceCounts.arrivalCount} arrived</span>
            <span className="text-xs text-zinc-500">Monitoring as owner</span>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-lg bg-brand-red/10 border border-brand-red/20 px-4 py-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <LiveKitRoom serverUrl={LIVEKIT_URL} token={livekitToken} connect={true} video={false} audio={false} className="flex flex-col gap-4 lg:flex-row">
          <RoomAudioRenderer />
          <div className="relative flex-1">
            <div className="aspect-video overflow-hidden rounded-xl bg-black"><RemoteVideo /></div>
            <div className="absolute left-4 top-4"><ViewerCount /></div>
            <div className="mt-4">
              <button onClick={handleEndStream} className="rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90">
                End Stream
              </button>
            </div>
          </div>
          <div className="flex h-[500px] w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 lg:h-auto lg:w-80">
            <div className="border-b border-zinc-800 px-4 py-3"><h3 className="text-sm font-semibold">Live Chat</h3></div>
            <div className="flex-1 overflow-hidden"><BroadcastChat /></div>
          </div>
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{venue.name}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-red/20 px-2.5 py-0.5 text-xs font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-red" />
            YOU ARE LIVE
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{attendanceCounts.intentCount} coming</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">{attendanceCounts.arrivalCount} arrived</span>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-brand-red/10 border border-brand-red/20 px-4 py-2">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <LiveKitRoom serverUrl={LIVEKIT_URL} token={livekitToken!} connect={true} video={true} audio={true} className="flex flex-col gap-4 lg:flex-row">
        <GoLiveOnPublish streamId={stream!.id} authToken={authToken!} />
        <div className="relative flex-1">
          <div className="aspect-video overflow-hidden rounded-xl bg-black"><BroadcasterPreview /></div>
          <div className="absolute left-4 top-4"><ViewerCount /></div>
          <div className="mt-4"><LiveControls stream={stream!} onEnd={handleEndStream} /></div>
        </div>
        <div className="flex h-[500px] w-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 lg:h-auto lg:w-80">
          <div className="border-b border-zinc-800 px-4 py-3"><h3 className="text-sm font-semibold">Live Chat</h3></div>
          <div className="flex-1 overflow-hidden"><BroadcastChat /></div>
        </div>
      </LiveKitRoom>
    </div>
  );
}
