interface AccountTypeSelectorProps {
  onSelect: (type: "owner" | "promoter" | "viewer") => void;
}

export function AccountTypeSelector({ onSelect }: AccountTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">I am a...</p>
      <button
        onClick={() => onSelect("viewer")}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500"
      >
        <p className="font-medium">Viewer</p>
        <p className="mt-1 text-sm text-zinc-400">Browse venues, watch live streams, and track visits</p>
      </button>
      <button
        onClick={() => onSelect("owner")}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500"
      >
        <p className="font-medium">Venue Owner</p>
        <p className="mt-1 text-sm text-zinc-400">Register your venue and manage promoters</p>
      </button>
      <button
        onClick={() => onSelect("promoter")}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500"
      >
        <p className="font-medium">Venue Promoter</p>
        <p className="mt-1 text-sm text-zinc-400">I have an invite code from a venue owner</p>
      </button>
    </div>
  );
}
