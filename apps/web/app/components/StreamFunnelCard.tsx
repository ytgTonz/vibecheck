import { LiveStream } from "@vibecheck/shared";

interface Props {
  streams: LiveStream[];
  loading: boolean;
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function FunnelStep({
  label,
  value,
  isLast,
}: {
  label: string;
  value: number;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-center">
        <p className="text-lg font-bold leading-none text-white">{value}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
      </div>
      {!isLast && (
        <svg
          className="h-3 w-3 shrink-0 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );
}

export default function StreamFunnelCard({ streams, loading }: Props) {
  if (loading) {
    return (
      <div className="border-t border-zinc-800 pt-4">
        <div className="mb-3 h-4 w-36 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-800/60" />
          ))}
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="border-t border-zinc-800 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Recent streams</h3>
        <p className="text-sm text-zinc-500">No streams yet. Go live to start tracking your audience.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-800 pt-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">Recent streams</h3>
      <div className="space-y-2">
        {streams.map((stream) => {
          const duration = formatDuration(stream.startedAt, stream.endedAt);
          const date = formatDate(stream.startedAt);
          return (
            <div
              key={stream.id}
              className="rounded-lg bg-zinc-800/50 px-4 py-3"
            >
              <p className="mb-2 text-xs text-zinc-500">
                {date}
                {duration && (
                  <>
                    {" "}
                    <span className="text-zinc-600">·</span> {duration}
                  </>
                )}
              </p>
              <div className="flex items-center gap-3">
                <FunnelStep label="saw it" value={stream.viewerPeak} />
                <FunnelStep label="said coming" value={stream.intentCount ?? 0} />
                <FunnelStep label="arrived" value={stream.arrivalCount ?? 0} isLast />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
