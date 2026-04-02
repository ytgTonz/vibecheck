import { AdminUser } from "@vibecheck/shared";

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-900/50 text-purple-400",
  VENUE_OWNER: "bg-blue-900/50 text-blue-400",
  VENUE_PROMOTER: "bg-green-900/50 text-green-400",
  VIEWER: "bg-zinc-800/50 text-zinc-400",
};

interface UserCardProps {
  user: AdminUser;
  deletingUserId: string | null;
  onDelete: (userId: string, userName: string) => void;
}

export function UserCard({ user: u, deletingUserId, onDelete }: UserCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">{u.name}</p>
          <p className="text-xs text-zinc-500">{u.email}</p>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[u.role] || "bg-zinc-700 text-zinc-300"}`}>
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
            onClick={() => onDelete(u.id, u.name)}
            disabled={deletingUserId === u.id}
            className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingUserId === u.id ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
