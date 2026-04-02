import { AdminUser } from "@vibecheck/shared";

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-900/50 text-purple-400",
  VENUE_OWNER: "bg-blue-900/50 text-blue-400",
  VENUE_PROMOTER: "bg-green-900/50 text-green-400",
  VIEWER: "bg-zinc-800/50 text-zinc-400",
};

interface UserTableProps {
  users: AdminUser[];
  deletingUserId: string | null;
  onDelete: (userId: string, userName: string) => void;
}

export function UserTable({ users, deletingUserId, onDelete }: UserTableProps) {
  return (
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
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[u.role] || "bg-zinc-700 text-zinc-300"}`}>
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
                    onClick={() => onDelete(u.id, u.name)}
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
  );
}
