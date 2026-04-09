"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat, useLocalParticipant, useRemoteParticipants } from "@livekit/components-react";

interface PendingMessage {
  id: string;
  text: string;
  sentAt: number;
}

const PENDING_TIMEOUT_MS = 10_000;

const AVATAR_COLORS = [
  "bg-purple-500", "bg-blue-500", "bg-emerald-500",
  "bg-orange-500", "bg-pink-500", "bg-cyan-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  return `${Math.floor(diffMins / 60)}h`;
}

interface ChatOverlayProps {
  chatOpen: boolean;
  onViewerCount?: (count: number) => void;
}

export function ChatOverlay({ chatOpen, onViewerCount }: ChatOverlayProps) {
  const { chatMessages, send } = useChat();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Report viewer count upward
  useEffect(() => {
    onViewerCount?.(remoteParticipants.length);
  }, [remoteParticipants.length, onViewerCount]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, pending]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [chatOpen]);

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

  const localDisplayName = localParticipant?.name || localParticipant?.identity || "You";

  return (
    <div className="px-4 pb-2">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="mb-2 max-h-36 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chatMessages.slice(-20).map((msg, i) => {
          const name = msg.from?.name || msg.from?.identity || "Viewer";
          const color = getAvatarColor(name);
          const initials = getInitials(name);
          const time = getRelativeTime(msg.timestamp);
          return (
            <div key={i} className="flex items-start gap-2">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white drop-shadow">{name}</span>
                  <span className="text-xs text-white/40">{time}</span>
                </div>
                <p className="text-sm text-white/80 drop-shadow leading-snug">{msg.message}</p>
              </div>
            </div>
          );
        })}
        {pending.map((p) => {
          const color = getAvatarColor(localDisplayName);
          const initials = getInitials(localDisplayName);
          return (
            <div key={p.id} className="flex items-start gap-2 opacity-50">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white drop-shadow">{localDisplayName}</span>
                  <span className="text-xs text-white/40">now</span>
                </div>
                <p className="text-sm text-white/80 drop-shadow leading-snug">{p.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat input — shown when chatOpen */}
      {chatOpen && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            className="flex-1 rounded-full bg-black/50 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/30 backdrop-blur-sm"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-full bg-brand-red px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
