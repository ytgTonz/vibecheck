import Link from "next/link";
import { AdminVenue } from "@vibecheck/shared";

interface VenueTableProps {
  venues: AdminVenue[];
  deletingVenueId: string | null;
  onDelete: (venueId: string, venueName: string) => void;
}

export function VenueTable({ venues, deletingVenueId, onDelete }: VenueTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs text-zinc-500">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Type</th>
            <th className="pb-2 pr-4">Location</th>
            <th className="pb-2 pr-4">Owner</th>
            <th className="pb-2 pr-4 text-center">Promoters</th>
            <th className="pb-2 pr-4">Created</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} className="border-b border-zinc-800/50">
              <td className="py-3 pr-4 font-medium">
                <Link href={`/venues/${v.id}`} className="hover:text-zinc-300 hover:underline">{v.name}</Link>
              </td>
              <td className="py-3 pr-4 text-zinc-400">{v.type.replace(/_/g, " ")}</td>
              <td className="py-3 pr-4 text-zinc-400">{v.location}</td>
              <td className="py-3 pr-4">
                <p className="text-sm">{v.owner.name}</p>
                <p className="text-xs text-zinc-500">{v.owner.email}</p>
              </td>
              <td className="py-3 pr-4 text-center text-zinc-400">{v._count.promoters}</td>
              <td className="py-3 pr-4 text-xs text-zinc-500">{new Date(v.createdAt).toLocaleDateString()}</td>
              <td className="py-3">
                <button
                  onClick={() => onDelete(v.id, v.name)}
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
  );
}
