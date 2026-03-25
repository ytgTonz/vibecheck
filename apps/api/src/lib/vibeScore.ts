interface VibeScoreInput {
  isLive: boolean;
  currentViewerCount: number;
  recentStreams: { viewerPeak: number; endedAt: Date }[];
}

const VIEWER_CAP = 50;
const PEAK_CAP = 40;
const FREQUENCY_CAP = 5;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function computeVibeScore(input: VibeScoreInput): number {
  const { isLive, currentViewerCount, recentStreams } = input;

  // Live now bonus (40 pts)
  const liveBonus = isLive ? 40 : 0;

  // Current viewers (25 pts) — linear scale capped at VIEWER_CAP
  const viewerPoints = Math.min(currentViewerCount / VIEWER_CAP, 1) * 25;

  // Historical avg peak (20 pts) — average viewerPeak from recent ended streams
  let historyPoints = 0;
  if (recentStreams.length > 0) {
    const avgPeak =
      recentStreams.reduce((sum, s) => sum + s.viewerPeak, 0) / recentStreams.length;
    historyPoints = Math.min(avgPeak / PEAK_CAP, 1) * 20;
  }

  // Stream frequency (15 pts) — streams ended in last 7 days
  const now = Date.now();
  const streamsLast7Days = recentStreams.filter(
    (s) => now - s.endedAt.getTime() <= SEVEN_DAYS_MS,
  ).length;
  const frequencyPoints = Math.min(streamsLast7Days / FREQUENCY_CAP, 1) * 15;

  return Math.round(liveBonus + viewerPoints + historyPoints + frequencyPoints);
}
