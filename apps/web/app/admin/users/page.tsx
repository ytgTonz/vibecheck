"use client";

import { useEffect, useState } from "react";
import {
  setBaseUrl,
  fetchAdminUsers,
  deleteAdminUser,
  useAuthStore,
  AdminUser,
} from "@vibecheck/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
setBaseUrl(API_URL);

const roleBadgeColors: Record<string, string> = {
  ADMIN: "bg-purple-900/50 text-purple-400",
  VENUE_OWNER: "bg-blue-900/50 text-blue-400",
  VENUE_PROMOTER: "bg-green-900/50 text-green-400",
};

const roleOptions = ["ALL", "ADMIN", "VENUE_OWNER", "VENUE_PROMOTER"] as const;
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

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminUsers(token, {
      page: targetPage,
      query: query.trim() || undefined,
      role: role !== "ALL" ? role : undefined,
    })
      .then((res) => {
        setUsers(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers(page);
  }, [token, page, query, role]);

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete user "${userName}"? This will remove all their data.`)) return;

    setDeletingUserId(userId);
    setNotice(null);

    try {
      await deleteAdminUser(userId, token);
      const targetPage = getTargetPageAfterDelete(page, users.length, total);
      setNotice({ type: "success", message: `Deleted user "${userName}".` });

      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        loadUsers(targetPage);
      }
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete user",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = query.trim().length > 0 || role !== "ALL";

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
          onClick={() => loadUsers(page)}
          className="mt-4 rounded-lg border border-red-800/60 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-700 hover:text-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className="min-w-[220px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All roles" : option.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setQuery("");
                setRole("ALL");
                setPage(1);
              }}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-base font-medium text-zinc-100">No users found</p>
          <p className="mt-2 text-sm text-zinc-500">
            {hasFilters ? "Try changing the search or role filter." : "There are no users to moderate yet."}
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
          placeholder="Search name or email"
          className="min-w-[220px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option === "ALL" ? "All roles" : option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setRole("ALL");
              setPage(1);
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        {total} user{total !== 1 ? "s" : ""}
        {hasFilters ? " matching current filters" : ""}
      </p>

      <div className="grid gap-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-100">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleBadgeColors[u.role] || "bg-zinc-700 text-zinc-300"}`}>
                {u.role.replace(/_/g, " ")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-zinc-800/70 px-3 py-2">
                <p className="text-lg font-semibold text-white">{u._count.ownedVenues}</p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Owned</p>
              </div>
              <div className="rounded-lg bg-zinc-800/70 px-3 py-2">
                <p className="text-lg font-semibold text-white">{u._count.venueLinks}</p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Linked</p>
              </div>
              <div className="rounded-lg bg-zinc-800/70 px-3 py-2">
                <p className="text-lg font-semibold text-white">{u._count.feedback}</p>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Feedback</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
              <p className="text-xs text-zinc-500">Joined {new Date(u.createdAt).toLocaleDateString()}</p>
              {u.role !== "ADMIN" && (
                <button
                  onClick={() => handleDelete(u.id, u.name)}
                  disabled={deletingUserId === u.id}
                  className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingUserId === u.id ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Email</th>
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4 text-center">Owned</th>
              <th className="pb-2 pr-4 text-center">Linked</th>
              <th className="pb-2 pr-4 text-center">Feedback</th>
              <th className="pb-2 pr-4">Joined</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/50">
                <td className="py-3 pr-4 font-medium">{u.name}</td>
                <td className="py-3 pr-4 text-zinc-400">{u.email}</td>
                <td className="py-3 pr-4">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleBadgeColors[u.role] || "bg-zinc-700 text-zinc-300"}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="py-3 pr-4 text-center text-zinc-400">{u._count.ownedVenues}</td>
                <td className="py-3 pr-4 text-center text-zinc-400">{u._count.venueLinks}</td>
                <td className="py-3 pr-4 text-center text-zinc-400">{u._count.feedback}</td>
                <td className="py-3 pr-4 text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-3 text-right">
                  {u.role !== "ADMIN" && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      disabled={deletingUserId === u.id}
                      className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingUserId === u.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
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
