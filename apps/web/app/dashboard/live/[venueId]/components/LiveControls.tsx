"use client";

import { useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { LiveStream } from "@vibecheck/shared";

interface LiveControlsProps {
  stream: LiveStream;
  onEnd: () => void;
}

export function LiveControls({ stream: _stream, onEnd }: LiveControlsProps) {
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
