"use client";

import { useState, useRef, useEffect } from "react";
import {
  setBaseUrl,
  submitFeedback,
  useAuthStore,
  FeedbackCategory,
  FeedbackRating,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: FeedbackCategory.BUG, label: "Bug" },
  { value: FeedbackCategory.SUGGESTION, label: "Suggestion" },
  { value: FeedbackCategory.GENERAL, label: "General" },
];

const RATINGS: { value: FeedbackRating; label: string; icon: string }[] = [
  { value: FeedbackRating.BAD, label: "Bad", icon: "👎" },
  { value: FeedbackRating.NEUTRAL, label: "Neutral", icon: "😐" },
  { value: FeedbackRating.GOOD, label: "Good", icon: "👍" },
];

export default function FeedbackButton() {
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>(FeedbackCategory.GENERAL);
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const resetForm = () => {
    setCategory(FeedbackCategory.GENERAL);
    setRating(null);
    setMessage("");
    setError(null);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!token || !rating) return;

    setSubmitting(true);
    setError(null);

    try {
      await submitFeedback(
        { category, rating, message: message.trim() || undefined },
        token
      );
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          if (!open) resetForm();
          setOpen(!open);
        }}
        className="text-zinc-400 transition-colors hover:text-zinc-200"
        aria-label="Send feedback"
      >
        Feedback
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          {submitted ? (
            <p className="text-center text-sm text-green-400">
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-zinc-200">
                Send feedback
              </p>

              {/* Rating */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-zinc-400">
                  How&apos;s your experience?
                </p>
                <div className="flex gap-2">
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRating(r.value)}
                      className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-xs transition-colors ${
                        rating === r.value
                          ? "bg-zinc-700 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750"
                      }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-zinc-400">Category</p>
                <div className="flex gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        category === c.value
                          ? "bg-white text-zinc-900"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              {error && (
                <p className="mb-2 text-xs text-red-400">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="w-full rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
