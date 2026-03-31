"use client";

import { useRef, useState } from "react";
import { useDataChannel } from "@livekit/components-react";

const EMOJIS = ["🔥", "❤️", "🎉", "😍", "👏"];

export function EmojiReactions() {
  const { send } = useDataChannel("reactions");
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);
  const nextId = useRef(0);

  useDataChannel("reactions", (msg) => {
    const emoji = new TextDecoder().decode(msg.payload);
    const id = nextId.current++;
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  });

  const sendReaction = (emoji: string) => {
    const payload = new TextEncoder().encode(emoji);
    send(payload, { reliable: false });
    const id = nextId.current++;
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="pointer-events-none flex flex-col items-center gap-1">
        {floatingEmojis.map(({ id, emoji }) => (
          <span key={id} className="animate-bounce text-2xl drop-shadow-lg" style={{ animationDuration: "1s" }}>
            {emoji}
          </span>
        ))}
      </div>
      <div className="flex flex-row flex-wrap gap-1.5 sm:flex-col sm:gap-2">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="h-8 w-8 rounded-full bg-black/30 text-base transition-transform hover:scale-110 hover:bg-black/50 sm:h-10 sm:w-10 sm:text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
