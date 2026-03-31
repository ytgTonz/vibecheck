"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@livekit/components-react";

export function BroadcastChat() {
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
        {chatMessages.slice(-20).map((msg, i) => (
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
