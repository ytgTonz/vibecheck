"use client";

import { useRef, useState } from "react";
import { useDataChannel } from "@livekit/components-react";

const REACTIONS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "👏", label: "Clap" },
];

interface FloatingEmoji {
  id: number;
  emoji: string;
  offsetX: number;
}

export function EmojiReactions() {
  const { send } = useDataChannel("reactions");
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const nextId = useRef(0);

  useDataChannel("reactions", (msg) => {
    const emoji = new TextDecoder().decode(msg.payload);
    addFloating(emoji);
  });

  const addFloating = (emoji: string) => {
    const id = nextId.current++;
    const offsetX = Math.floor(Math.random() * 24) - 12;
    setFloatingEmojis((prev) => [...prev, { id, emoji, offsetX }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 1800);
  };

  const sendReaction = (emoji: string) => {
    const payload = new TextEncoder().encode(emoji);
    send(payload, { reliable: false });
    addFloating(emoji);
  };

  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Floating emojis — positioned relative to this container, float upward */}
      <div className="pointer-events-none absolute bottom-full left-1/2 h-32 w-16 -translate-x-1/2">
        {floatingEmojis.map(({ id, emoji, offsetX }) => (
          <span
            key={id}
            className="absolute bottom-0 text-xl drop-shadow-lg"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              animation: "vcFloatUp 1.8s ease-out forwards",
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Reaction buttons — vertical stack */}
      {REACTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => sendReaction(emoji)}
          aria-label={`React with ${label}`}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-xl backdrop-blur-sm transition-transform hover:scale-110 hover:bg-black/60 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
