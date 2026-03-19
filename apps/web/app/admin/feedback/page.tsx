"use client";

import { useEffect, useState } from "react";
import {
  setBaseUrl,
  fetchAdminFeedback,
  useAuthStore,
  AdminFeedback,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

const categories = ["ALL", "BUG", "SUGGESTION", "GENERAL"] as const;
const ratings = ["ALL", "BAD", "NEUTRAL", "GOOD"] as const;

const ratingColors: Record<string, string> = {
  BAD: "bg-red-900/50 text-red-400",
  NEUTRAL: "bg-zinc-700 text-zinc-300",
  GOOD: "bg-green-900/50 text-green-400",
};

const categoryColors: Record<string, string> = {
  BUG: "bg-red-900/50 text-red-400",
  SUGGESTION: "bg-blue-900/50 text-blue-400",
  GENERAL: "bg-zinc-700 text-zinc-300",
};

export default function AdminFeedbackPage() {
  const { token } = useAuthStore();
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("ALL");
  const [rating, setRating] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminFeedback(token, {
      category: category !== "ALL" ? category : undefined,
      rating: rating !== "ALL" ? rating : undefined,
      page,
    })
      .then((res) => {
        setFeedback(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, category, rating, page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="mb-1 text-xs text-zinc-500">Category</p>
          <div className="flex gap-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {c === "ALL" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-zinc-500">Rating</p>
          <div className="flex gap-1">
            {ratings.map((r) => (
              <button
                key={r}
                onClick={() => { setRating(r); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  rating === r
                    ? "bg-white text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 h-4 w-48 rounded bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">No feedback found</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500">{total} result{total !== 1 ? "s" : ""}</p>
          <div className="space-y-3">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryColors[fb.category] || ""}`}>
                    {fb.category}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${ratingColors[fb.rating] || ""}`}>
                    {fb.rating}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {fb.message && (
                  <p className="mb-2 text-sm text-zinc-300">{fb.message}</p>
                )}
                <p className="text-xs text-zinc-500">
                  {fb.user.name} &middot; {fb.user.email}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
