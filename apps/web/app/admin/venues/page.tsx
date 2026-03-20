"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  setBaseUrl,
  fetchAdminVenues,
  deleteAdminVenue,
  useAuthStore,
  AdminVenue,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

const venueTypeOptions = ["ALL", "NIGHTCLUB", "BAR", "RESTAURANT_BAR", "LOUNGE", "SHISA_NYAMA", "ROOFTOP", "OTHER"] as const;
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

export default function AdminVenuesPage() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("ALL");
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null);

  const loadVenues = (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminVenues(token, {
      page: targetPage,
      query: query.trim() || undefined,
      type: type !== "ALL" ? type : undefined,
    })
      .then((res) => {
        setVenues(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVenues(page);
  }, [token, page, query, type]);

  const handleDelete = async (venueId: string, venueName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete venue "${venueName}"? This will remove all clips, invites, and promoter links.`)) return;

    setDeletingVenueId(venueId);
    setNotice(null);

    try {
      await deleteAdminVenue(venueId, token);
      const targetPage = getTargetPageAfterDelete(page, venues.length, total);
      setNotice({ type: "success", message: `Deleted venue "${venueName}".` });

      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        loadVenues(targetPage);
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete venue",
      });
    } finally {
      setDeletingVenueId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = query.trim().length > 0 || type !== "ALL";

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="h-4 w-48 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={() => loadVenues(page)}
          className="mt-4 rounded-lg border border-red-800/60 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-700 hover:text-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search venue, location, owner name, or email"
            className="min-w-[240px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          >
            {venueTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All venue types" : option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setQuery("");
                setType("ALL");
                setPage(1);
              }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-base font-medium text-zinc-100">No venues found</p>
          <p className="mt-2 text-sm text-zinc-500">
            {hasFilters ? "Try changing the search or venue type filter." : "There are no venues to moderate yet."}
          </p>
        </div>
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
          placeholder="Search venue, location, owner name, or email"
          className="min-w-[240px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        >
          {venueTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All venue types" : option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setType("ALL");
              setPage(1);
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        {total} venue{total !== 1 ? "s" : ""}
        {hasFilters ? " matching current filters" : ""}
      </p>

      <div className="grid gap-3 md:hidden">
        {venues.map((v) => (
          <div key={v.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/venues/${v.id}`} className="text-sm font-medium text-zinc-100 hover:text-zinc-300 hover:underline">
                  {v.name}
                </Link>
                <p className="mt-1 text-xs text-zinc-500">{v.location}</p>
              </div>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-300">
                {v.type.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 rounded-lg bg-zinc-800/70 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Owner</p>
              <p className="mt-1 text-sm text-zinc-100">{v.owner.name}</p>
              <p className="text-xs text-zinc-500">{v.owner.email}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/70 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-white">{v._count.clips}</p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Clips</p>
              </div>
              <div className="rounded-lg bg-zinc-800/70 px-3 py-2 text-center">
                <p className="text-lg font-semibold text-white">{v._count.promoters}</p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Promoters</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
              <p className="text-xs text-zinc-500">Created {new Date(v.createdAt).toLocaleDateString()}</p>
              <button
                onClick={() => handleDelete(v.id, v.name)}
                disabled={deletingVenueId === v.id}
                className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingVenueId === v.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Location</th>
              <th className="pb-2 pr-4">Owner</th>
              <th className="pb-2 pr-4 text-center">Clips</th>
              <th className="pb-2 pr-4 text-center">Promoters</th>
              <th className="pb-2 pr-4">Created</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} className="border-b border-zinc-800/50">
                <td className="py-3 pr-4 font-medium">
                  <Link href={`/venues/${v.id}`} className="hover:text-zinc-300 hover:underline">
                    {v.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-zinc-400">{v.type.replace(/_/g, " ")}</td>
                <td className="py-3 pr-4 text-zinc-400">{v.location}</td>
                <td className="py-3 pr-4">
                  <p className="text-sm">{v.owner.name}</p>
                  <p className="text-xs text-zinc-500">{v.owner.email}</p>
                </td>
                <td className="py-3 pr-4 text-center text-zinc-400">{v._count.clips}</td>
                <td className="py-3 pr-4 text-center text-zinc-400">{v._count.promoters}</td>
                <td className="py-3 pr-4 text-xs text-zinc-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                <td className="py-3">
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    disabled={deletingVenueId === v.id}
                    className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingVenueId === v.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
