"use client";

interface BottomBarProps {
  venueName: string;
  chatOpen: boolean;
  onChatToggle: () => void;
}

export function BottomBar({ venueName, chatOpen, onChatToggle }: BottomBarProps) {
  const handleShare = () => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      navigator.share({ title: venueName, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md px-4 py-3">
      {/* Chat toggle */}
      <button
        onClick={onChatToggle}
        aria-label="Toggle chat"
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
          chatOpen ? "bg-brand-red text-white" : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Share stream */}
      <button
        onClick={handleShare}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-red py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share stream
      </button>

      {/* Bookmark placeholder */}
      <button
        aria-label="Bookmark"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
        disabled
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
