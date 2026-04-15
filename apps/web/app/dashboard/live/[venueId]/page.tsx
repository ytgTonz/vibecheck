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
  useRequireAuth,
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

function LocalPreview({ stream }: { stream: MediaStream }) {
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (!node) return;
    node.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full rounded-xl object-cover"
    />
  );
}

export default function BroadcastPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const router = useRouter();
  const { user, token: authToken, ready, hydrated } = useRequireAuth((path) => router.replace(path));
  const broadcastStore = useBroadcastStore();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "previewing" | "connecting" | "live" | "monitoring" | "ended">("idle");
  const [error, setError] = useState<string | null>(null);
  const [attendanceCounts, setAttendanceCounts] = useState({ intentCount: 0, arrivalCount: 0 });
  const [peakViewerCount, setPeakViewerCount] = useState(0);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

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

  const handleViewerCountChange = useCallback((count: number) => {
    setPeakViewerCount((prev) => Math.max(prev, count));
  }, []);

  useSocket({ "attendance:update": handleAttendanceUpdate });

  useEffect(() => {
    if (!stream?.id) return;
    setPeakViewerCount(stream.viewerPeak ?? 0);
  }, [stream?.id, stream?.viewerPeak]);

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
    if (!ready || !venueId) return;

    fetchVenue(venueId)
      .then(async (v) => {
        setVenue(v);
        if (v.isLive && v.activeStreamId && user && v.ownerId === user.id) {
          const bs = useBroadcastStore.getState();
          if (bs.venueId === venueId && bs.streamId === v.activeStreamId) return;
          try {
            const { token: viewerToken } = await fetchViewerToken(v.activeStreamId, authToken ?? undefined);
            setStream({ id: v.activeStreamId } as LiveStream);
            setLivekitToken(viewerToken);
            setPhase("monitoring");
          } catch {
            setError("Failed to connect to stream");
          }
        }
      })
      .catch(() => setError("Failed to load venue"));
  }, [ready, user, authToken, venueId]);

  const stopPreview = useCallback(() => {
    setPreviewStream((current) => {
      current?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    return () => stopPreview();
  }, [stopPreview]);

  const startPreview = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPreviewStream(stream);
      setCameraEnabled(true);
      setMicEnabled(true);
      setPhase("previewing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access camera/microphone");
      setPhase("idle");
    }
  };

  const togglePreviewTrack = (kind: "video" | "audio") => {
    if (!previewStream) return;
    const tracks = kind === "video" ? previewStream.getVideoTracks() : previewStream.getAudioTracks();
    const nextEnabled = kind === "video" ? !cameraEnabled : !micEnabled;
    tracks.forEach((track) => {
      track.enabled = nextEnabled;
    });
    if (kind === "video") setCameraEnabled(nextEnabled);
    else setMicEnabled(nextEnabled);
  };

  const goLiveFromPreview = async () => {
    if (!authToken || !venueId) return;
    setPhase("connecting");
    setError(null);
    try {
      const newStream = await createStream(venueId, authToken);
      setStream(newStream);
      const { token: broadcasterToken } = await fetchStreamToken(newStream.id, authToken);
      setLivekitToken(broadcasterToken);
      stopPreview();
      setPhase("live");
      if (venue) broadcastStore.setBroadcast(venueId!, newStream.id, venue.name, broadcasterToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start stream");
      setPhase("previewing");
    }
  };

  const handleEndStream = async () => {
    if (!stream || !authToken) return;
    try {
      const ended = await endStream(stream.id, authToken, peakViewerCount);
      broadcastStore.clearBroadcast();
      setStream(ended);
      setPhase("ended");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end stream");
    }
  };

  if (!ready || !venue) {
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

  if (phase === "idle" || phase === "previewing" || phase === "connecting") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
          &larr; Dashboard
        </Link>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          <p className="mt-1 text-zinc-400">{venue.location}</p>
          {phase === "idle" ? (
            <p className="mt-4 text-sm text-zinc-500">
              Start a live stream to broadcast from this venue. You will get a camera/audio preview before going live.
            </p>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              Confirm your camera and microphone setup before going live.
            </p>
          )}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {(phase === "previewing" || phase === "connecting") && previewStream && (
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <div className="aspect-video">
                <LocalPreview stream={previewStream} />
              </div>
            </div>
          )}

          {phase === "idle" && (
            <button
              onClick={startPreview}
              className="mt-6 rounded-full bg-brand-red px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90"
            >
              Start Stream
            </button>
          )}

          {(phase === "previewing" || phase === "connecting") && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => togglePreviewTrack("video")}
                disabled={phase === "connecting"}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  cameraEnabled
                    ? "bg-zinc-800 text-white hover:bg-zinc-700"
                    : "bg-brand-red/20 text-red-400 hover:bg-red-500/30"
                } disabled:opacity-50`}
              >
                {cameraEnabled ? "Camera On" : "Camera Off"}
              </button>
              <button
                onClick={() => togglePreviewTrack("audio")}
                disabled={phase === "connecting"}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  micEnabled
                    ? "bg-zinc-800 text-white hover:bg-zinc-700"
                    : "bg-brand-red/20 text-red-400 hover:bg-red-500/30"
                } disabled:opacity-50`}
              >
                {micEnabled ? "Mic On" : "Mic Off"}
              </button>
              <button
                onClick={() => {
                  stopPreview();
                  setPhase("idle");
                }}
                disabled={phase === "connecting"}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={goLiveFromPreview}
                disabled={phase === "connecting"}
                className="rounded-full bg-brand-red px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90 disabled:opacity-50"
              >
                {phase === "connecting" ? "Connecting..." : "Go Live"}
              </button>
            </div>
          )}
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
            <div className="absolute left-4 top-4"><ViewerCount onCountChange={handleViewerCountChange} /></div>
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
          <div className="absolute left-4 top-4"><ViewerCount onCountChange={handleViewerCountChange} /></div>
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
