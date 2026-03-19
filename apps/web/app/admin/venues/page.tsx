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

export default function AdminVenuesPage() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVenues = (p: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminVenues(token, p)
      .then((res) => {
        setVenues(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVenues(page);
  }, [token, page]);

  const handleDelete = async (venueId: string, venueName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete venue "${venueName}"? This will remove all clips, invites, and promoter links.`)) return;
    try {
      await deleteAdminVenue(venueId, token);
      loadVenues(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete venue");
    }
  };

  const totalPages = Math.ceil(total / 50);

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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">{total} venue{total !== 1 ? "s" : ""}</p>

      <div className="overflow-x-auto">
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
                <td className="py-3 pr-4 text-xs text-zinc-500">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    className="text-xs text-red-400 transition-colors hover:text-red-300"
                  >
                    Delete
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
