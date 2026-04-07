"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRModalProps {
  visible: boolean;
  qrToken: string;
  expiresAt: string;
  incentive: { title: string; description: string } | null;
  onClose: () => void;
}

function useCountdown(expiresAt: string) {
  const getSecondsLeft = () => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(diff, 0);
  };

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(getSecondsLeft());
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;

  if (secondsLeft <= 0) return "Expired";
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function QRModal({ visible, qrToken, expiresAt, incentive, onClose }: QRModalProps) {
  const timeLeft = useCountdown(expiresAt);
  const expired = timeLeft === "Expired";

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 px-6 pb-6 pt-8">
        <h2 className="text-center text-2xl font-bold text-zinc-100">Show this at the door</h2>

        {incentive && (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-100">{incentive.title}</p>
            <p className="mt-0.5 text-sm text-zinc-400">{incentive.description}</p>
          </div>
        )}

        <div className={`mx-auto mt-5 w-fit rounded-2xl bg-white p-5 ${expired ? "opacity-30" : ""}`}>
          <QRCodeSVG value={qrToken} size={220} bgColor="white" fgColor="black" />
        </div>

        <div className="mt-4 flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              expired ? "bg-red-900/50 text-red-400" : "bg-zinc-800 text-zinc-300"
            }`}
          >
            {expired ? "QR Expired" : `Expires in ${timeLeft}`}
          </span>
        </div>

        {expired && (
          <p className="mt-3 text-center text-sm text-zinc-500">
            This QR code has expired. Contact the venue if you need assistance.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-zinc-800 py-3 text-[15px] font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
