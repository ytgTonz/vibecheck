"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  setBaseUrl,
  fetchAdminClips,
  deleteAdminClip,
  useAuthStore,
  AdminClip,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminClipsPage() {
  const { token } = useAuthStore();
  const [clips, setClips] = useState<AdminClip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClips = (p: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminClips(token, p)
      .then((res) => {
        setClips(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClips(page);
  }, [token, page]);

  const handleDelete = async (clipId: string) => {
    if (!token) return;
    if (!window.confirm("Delete this clip? This cannot be undone.")) return;
    try {
      await deleteAdminClip(clipId, token);
      loadClips(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete clip");
    }
  };

  const totalPages = Math.ceil(total / 50);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 h-32 rounded bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{total} clip{total !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
          >
            {/* Thumbnail */}
            <div className="relative h-36 w-full bg-zinc-800">
              {clip.thumbnail ? (
                <Image
                  src={clip.thumbnail}
                  alt={clip.caption || "Clip"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-zinc-600">
                  No thumbnail
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="truncate text-sm font-medium">
                {clip.caption || "Untitled clip"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {clip.venue.name}
              </p>
              <p className="text-xs text-zinc-500">
                {clip.uploader ? `${clip.uploader.name} (${clip.uploader.email})` : "Unknown uploader"}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {clip.views} views &middot; {timeAgo(clip.createdAt)}
                </span>
                <button
                  onClick={() => handleDelete(clip.id)}
                  className="text-xs text-red-400 transition-colors hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
