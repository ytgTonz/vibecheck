"use client";

import { useEffect, useState } from "react";
import { ADMIN_PAGE_SIZE, getTargetPageAfterDelete } from "@/lib/pagination.mjs";
import { fetchAdminVenues, deleteAdminVenue, useAuthStore, AdminVenue } from "@vibecheck/shared";
import { Notice } from "../components/Notice";
import { Pagination } from "../components/Pagination";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { VenueFilters } from "./components/VenueFilters";
import { VenueAdminCard } from "./components/VenueAdminCard";
import { VenueTable } from "./components/VenueTable";

type NoticeState = { type: "success" | "error"; message: string };

export default function AdminVenuesPage() {
  const { token } = useAuthStore();
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null);

  const loadVenues = (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminVenues(token, { page: targetPage, query: query.trim() || undefined, type: type !== "ALL" ? type : undefined })
      .then((res) => { setVenues(res.data); setTotal(res.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadVenues(page); }, [token, page, query, type]);

  const handleDelete = async (venueId: string, venueName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete venue "${venueName}"? This will remove all streams, invites, and promoter links.`)) return;
    setDeletingVenueId(venueId);
    setNotice(null);
    try {
      await deleteAdminVenue(venueId, token);
      const targetPage = getTargetPageAfterDelete(page, venues.length, total);
      setNotice({ type: "success", message: `Deleted venue "${venueName}".` });
      if (targetPage !== page) { setPage(targetPage); } else { loadVenues(targetPage); }
    } catch (err) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to delete venue" });
    } finally {
      setDeletingVenueId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hasFilters = query.trim().length > 0 || type !== "ALL";

  const handleClearFilters = () => { setQuery(""); setType("ALL"); setPage(1); };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={() => loadVenues(page)} className="mt-4 rounded-lg border border-red-800/60 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-700 hover:text-red-200">
          Retry
        </button>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="space-y-4">
        <VenueFilters query={query} type={type} hasFilters={hasFilters} onQueryChange={(v) => { setQuery(v); setPage(1); }} onTypeChange={(v) => { setType(v); setPage(1); }} onClear={handleClearFilters} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-base font-medium text-zinc-100">No venues found</p>
          <p className="mt-2 text-sm text-zinc-500">{hasFilters ? "Try changing the search or venue type filter." : "There are no venues to moderate yet."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && <Notice type={notice.type} message={notice.message} />}
      <VenueFilters query={query} type={type} hasFilters={hasFilters} onQueryChange={(v) => { setQuery(v); setPage(1); }} onTypeChange={(v) => { setType(v); setPage(1); }} onClear={handleClearFilters} />
      <p className="text-sm text-zinc-500">{total} venue{total !== 1 ? "s" : ""}{hasFilters ? " matching current filters" : ""}</p>
      <div className="grid gap-3 md:hidden">
        {venues.map((v) => <VenueAdminCard key={v.id} venue={v} deletingVenueId={deletingVenueId} onDelete={handleDelete} />)}
      </div>
      <VenueTable venues={venues} deletingVenueId={deletingVenueId} onDelete={handleDelete} />
      <Pagination page={page} totalPages={totalPages} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
    </div>
  );
}
