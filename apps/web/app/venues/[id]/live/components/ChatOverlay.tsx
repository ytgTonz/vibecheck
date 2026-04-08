"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat, useLocalParticipant } from "@livekit/components-react";

interface PendingMessage {
  id: string;
  text: string;
  sentAt: number;
}

const PENDING_TIMEOUT_MS = 10_000;

export function ChatOverlay() {
  const { chatMessages, send } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, pending]);

  // Remove pending messages once LiveKit echoes them back
  useEffect(() => {
    if (pending.length === 0) return;
    const localIdentity = localParticipant?.identity;
    setPending((prev) =>
      prev.filter(
        (p) =>
          !chatMessages.some(
            (m) =>
              m.message === p.text &&
              m.from?.identity === localIdentity &&
              m.timestamp >= p.sentAt,
          ),
      ),
    );
  }, [chatMessages, localParticipant?.identity, pending.length]);

  // Clean up stale pending messages that never got echoed
  useEffect(() => {
    if (pending.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setPending((prev) => prev.filter((p) => now - p.sentAt < PENDING_TIMEOUT_MS));
    }, PENDING_TIMEOUT_MS);
    return () => clearInterval(timer);
  }, [pending.length]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setPending((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, sentAt: Date.now() }]);
    send(trimmed);
    setMessage("");
  }, [message, send]);

  const displayName = localParticipant?.name || localParticipant?.identity || "You";

  return (
    <div className="absolute bottom-0 left-0 z-10 w-full px-4 pb-4 sm:w-1/2 sm:max-w-md">
      <div
        ref={scrollRef}
        className="mb-3 max-h-24 space-y-1 overflow-y-auto sm:max-h-48 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chatMessages.slice(-20).map((msg, i) => (
          <p key={i} className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="font-semibold text-white">
              {msg.from?.name || msg.from?.identity || "Viewer"}
            </span>
            <span className="ml-1.5 text-white/70">{msg.message}</span>
          </p>
        ))}
        {pending.map((p) => (
          <p key={p.id} className="text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-50">
            <span className="font-semibold text-white">{displayName}</span>
            <span className="ml-1.5 text-white/70">{p.text}</span>
          </p>
        ))}
      </div>
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
