"use client";

import { useEffect, useState } from "react";
import { ADMIN_PAGE_SIZE, getTargetPageAfterDelete } from "@/lib/pagination.mjs";
import { fetchAdminUsers, deleteAdminUser, useAuthStore, AdminUser } from "@vibecheck/shared";
import { Notice } from "../components/Notice";
import { Pagination } from "../components/Pagination";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { AdminPageToolbar } from "../components/AdminPageToolbar";
import { UserFilters } from "./components/UserFilters";
import { UserCard } from "./components/UserCard";
import { UserTable } from "./components/UserTable";

type NoticeState = { type: "success" | "error"; message: string };

export default function AdminUsersPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = (targetPage: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchAdminUsers(token, { page: targetPage, query: query.trim() || undefined, role: role !== "ALL" ? role : undefined })
      .then((res) => { setUsers(res.data); setTotal(res.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(page); }, [token, page, query, role]);

  const handleDelete = async (userId: string, userName: string) => {
    if (!token) return;
    if (!window.confirm(`Delete user "${userName}"? This will remove all their data.`)) return;
    setDeletingUserId(userId);
    setNotice(null);
    try {
      await deleteAdminUser(userId, token);
      const targetPage = getTargetPageAfterDelete(page, users.length, total);
      setNotice({ type: "success", message: `Deleted user "${userName}".` });
      if (targetPage !== page) { setPage(targetPage); } else { loadUsers(targetPage); }
    } catch (err) {
      setNotice({ type: "error", message: err instanceof Error ? err.message : "Failed to delete user" });
    } finally {
      setDeletingUserId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const hasFilters = query.trim().length > 0 || role !== "ALL";

  const handleClearFilters = () => { setQuery(""); setRole("ALL"); setPage(1); };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={() => loadUsers(page)} className="mt-4 rounded-lg border border-red-800/60 px-3 py-2 text-sm text-red-300 transition-colors hover:border-red-700 hover:text-red-200">
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-4">
        <AdminPageToolbar
          title="User Management"
          description="Search and moderate platform accounts by role."
          searchSlot={
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          }
          secondaryAction={
            hasFilters ? (
              <button
                onClick={handleClearFilters}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Clear filters
              </button>
            ) : null
          }
          primaryAction={
            <button
              onClick={() => loadUsers(page)}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Refresh
            </button>
          }
        />
        <UserFilters query={query} role={role} hasFilters={hasFilters} onQueryChange={(v) => { setQuery(v); setPage(1); }} onRoleChange={(v) => { setRole(v); setPage(1); }} onClear={handleClearFilters} showSearch={false} showClear={false} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-base font-medium text-zinc-100">No users found</p>
          <p className="mt-2 text-sm text-zinc-500">{hasFilters ? "Try changing the search or role filter." : "There are no users to moderate yet."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && <Notice type={notice.type} message={notice.message} />}
      <AdminPageToolbar
        title="User Management"
        description="Search and moderate platform accounts by role."
        searchSlot={
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
        }
        secondaryAction={
          hasFilters ? (
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear filters
            </button>
          ) : null
        }
        primaryAction={
          <button
            onClick={() => loadUsers(page)}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Refresh
          </button>
        }
        meta={`${total} user${total !== 1 ? "s" : ""}${hasFilters ? " matching current filters" : ""}`}
      />
      <UserFilters query={query} role={role} hasFilters={hasFilters} onQueryChange={(v) => { setQuery(v); setPage(1); }} onRoleChange={(v) => { setRole(v); setPage(1); }} onClear={handleClearFilters} showSearch={false} showClear={false} />
      <div className="grid gap-3 md:hidden">
        {users.map((u) => <UserCard key={u.id} user={u} deletingUserId={deletingUserId} onDelete={handleDelete} />)}
      </div>
      <UserTable users={users} deletingUserId={deletingUserId} onDelete={handleDelete} />
      <Pagination page={page} totalPages={totalPages} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
    </div>
  );
}
