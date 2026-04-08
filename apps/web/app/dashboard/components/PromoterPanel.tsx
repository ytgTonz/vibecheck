import { VenuePromoter, Invite } from "@vibecheck/shared";

interface PromoterPanelProps {
  promoters: VenuePromoter[] | undefined;
  invite: Invite | undefined;
  loading: boolean;
  onLoad: () => void;
  onGenerateInvite: () => void;
  onRemovePromoter: (userId: string) => void;
}

export function PromoterPanel({
  promoters, invite, loading,
  onLoad, onGenerateInvite, onRemovePromoter,
}: PromoterPanelProps) {
  return (
    <div className="border-t border-zinc-800 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Promoters</h3>
        <div className="flex gap-2">
          <button onClick={onLoad} className="text-xs text-zinc-400 hover:text-white">
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={onGenerateInvite}
            className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
          >
            Generate invite
          </button>
        </div>
      </div>

      {invite && (
        <div className="mb-3 rounded-lg bg-zinc-800 p-3">
          <p className="text-xs text-zinc-400">Invite code (expires in 7 days):</p>
          <p className="mt-1 font-mono text-lg font-bold tracking-widest text-white">{invite.code}</p>
          <p className="mt-1 text-xs text-zinc-500">Share this with your promoter to let them sign up</p>
        </div>
      )}

      {promoters && promoters.length > 0 ? (
        <div className="space-y-2">
          {promoters.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{p.user?.name || "Unknown"}</p>
                <p className="text-xs text-zinc-500">{p.user?.email}</p>
              </div>
              <button
                onClick={() => onRemovePromoter(p.userId)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : promoters ? (
        <p className="text-sm text-zinc-500">No promoters yet. Generate an invite code to add one.</p>
      ) : (
        <button onClick={onLoad} className="text-sm text-zinc-400 hover:text-white">
          Load promoters
        </button>
      )}
    </div>
  );
}
