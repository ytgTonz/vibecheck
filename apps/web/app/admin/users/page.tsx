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

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = (p: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminUsers(token, p)
      .then((res) => {
        setUsers(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers(page);
  }, [token, page]);

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete user "${userName}"? This will remove all their data.`)) return;
    try {
      await deleteAdminUser(userId, token);
      loadUsers(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
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
      <p className="text-sm text-zinc-500">{total} user{total !== 1 ? "s" : ""}</p>

      <div className="overflow-x-auto">
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
                <td className="py-3 pr-4 text-xs text-zinc-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  {u.role !== "ADMIN" && (
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-xs text-red-400 transition-colors hover:text-red-300"
                    >
                      Delete
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
