"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const PAGE_SIZE = 50;

type Notice = {
  type: "success" | "error";
  message: string;
};

function getTargetPageAfterDelete(currentPage: number, itemCount: number, totalCount: number) {
  const nextTotal = Math.max(0, totalCount - 1);
  const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));

  if (itemCount <= 1 && currentPage > 1) {
    return Math.min(currentPage - 1, nextTotalPages);
  }

  return Math.min(currentPage, nextTotalPages);
}

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
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null);

  const loadClips = (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminClips(token, {
      page: targetPage,
      query: query.trim() || undefined,
    })
      .then((res) => {
        setClips(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClips(page);
  }, [token, page, query]);

  const handleDelete = async (clipId: string) => {
    if (!token) return;
    if (!window.confirm("Delete this clip? This cannot be undone.")) return;

    setDeletingClipId(clipId);
    setNotice(null);

    try {
      await deleteAdminClip(clipId, token);
      const targetPage = getTargetPageAfterDelete(page, clips.length, total);
      setNotice({ type: "success", message: "Deleted clip." });

      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        loadClips(targetPage);
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete clip",
      });
    } finally {
      setDeletingClipId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = query.trim().length > 0;

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
      {notice && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            notice.type === "success"
              ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
              : "border-red-900/50 bg-red-950/30 text-red-400"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search caption, venue, uploader, or email"
          className="min-w-[240px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        {total} clip{total !== 1 ? "s" : ""}
        {hasFilters ? " matching current filters" : ""}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clips.map((clip) => (
          <div key={clip.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
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

            <div className="space-y-2 p-4">
              <div>
                <p className="truncate text-sm font-medium">{clip.caption || "Untitled clip"}</p>
                <Link href={`/venues/${clip.venue.id}`} className="mt-1 block text-xs text-zinc-400 hover:text-zinc-200 hover:underline">
                  {clip.venue.name}
                </Link>
              </div>
              <p className="text-xs text-zinc-500">
                {clip.uploader ? `${clip.uploader.name} (${clip.uploader.email})` : "Unknown uploader"}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">{clip.views} views &middot; {timeAgo(clip.createdAt)}</span>
                <button
                  onClick={() => handleDelete(clip.id)}
                  disabled={deletingClipId === clip.id}
                  className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingClipId === clip.id ? "Deleting..." : "Delete"}
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
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
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
