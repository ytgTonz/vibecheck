interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
