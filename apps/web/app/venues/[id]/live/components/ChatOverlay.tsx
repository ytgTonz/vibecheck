"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@livekit/components-react";

export function ChatOverlay() {
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
