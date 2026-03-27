interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="h-4 w-48 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}
