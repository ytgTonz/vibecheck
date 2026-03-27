import Link from "next/link";
import { AdminVenue } from "@vibecheck/shared";

interface VenueAdminCardProps {
  venue: AdminVenue;
  deletingVenueId: string | null;
  onDelete: (venueId: string, venueName: string) => void;
}

export function VenueAdminCard({ venue: v, deletingVenueId, onDelete }: VenueAdminCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
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

      <div className="mt-4">
        <div className="rounded-lg bg-zinc-800/70 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-white">{v._count.promoters}</p>
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Promoters</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-500">Created {new Date(v.createdAt).toLocaleDateString()}</p>
        <button
          onClick={() => onDelete(v.id, v.name)}
          disabled={deletingVenueId === v.id}
          className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs text-red-300 transition-colors hover:border-red-700 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deletingVenueId === v.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
