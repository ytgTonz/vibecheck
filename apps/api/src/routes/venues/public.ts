import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { computeVibeScore } from '../../lib/vibeScore';

const router = Router();

// GET /venues — return all venues ranked by vibe score
router.get('/', async (_req: Request, res: Response) => {
  const [venues, activeStreams, recentEndedStreams] = await Promise.all([
    prisma.venue.findMany(),
    prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      select: { id: true, venueId: true, currentViewerCount: true },
    }),
    prisma.liveStream.findMany({
      where: {
        status: 'ENDED',
        endedAt: { not: null, gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { venueId: true, viewerPeak: true, endedAt: true },
      orderBy: { endedAt: 'desc' },
    }),
  ]);

  const liveMap = new Map(
    activeStreams.map((s) => [s.venueId, { id: s.id, viewers: s.currentViewerCount }]),
  );

  // Group ended streams by venue (max 10 per venue for avg peak calc)
  const historyMap = new Map<string, { viewerPeak: number; endedAt: Date }[]>();
  for (const s of recentEndedStreams) {
    const list = historyMap.get(s.venueId) || [];
    if (list.length < 10 && s.endedAt) {
      list.push({ viewerPeak: s.viewerPeak, endedAt: s.endedAt });
      historyMap.set(s.venueId, list);
    }
  }

  const enriched = venues.map((venue) => {
    const active = liveMap.get(venue.id);
    const isLive = !!active;
    return {
      ...venue,
      isLive,
      activeStreamId: active?.id ?? undefined,
      vibeScore: computeVibeScore({
        isLive,
        currentViewerCount: active?.viewers ?? 0,
        recentStreams: historyMap.get(venue.id) || [],
      }),
    };
  });

  // Sort by vibe score descending, then alphabetical as tiebreaker
  enriched.sort((a, b) => {
    if (a.vibeScore !== b.vibeScore) return b.vibeScore - a.vibeScore;
    return a.name.localeCompare(b.name);
  });

  res.json(enriched);
});

// GET /venues/:id — return a single venue by ID
router.get('/:id', async (req: Request, res: Response) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
  });

  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  const activeStream = await prisma.liveStream.findFirst({
    where: { venueId: venue.id, status: 'LIVE' },
    select: { id: true },
  });

  let intentCount = 0;
  let arrivalCount = 0;

  if (activeStream) {
    [intentCount, arrivalCount] = await Promise.all([
      prisma.streamAttendance.count({ where: { streamId: activeStream.id, type: 'INTENT' } }),
      prisma.streamAttendance.count({ where: { streamId: activeStream.id, type: 'ARRIVAL' } }),
    ]);
  }

  res.json({
    ...venue,
    isLive: !!activeStream,
    activeStreamId: activeStream?.id ?? undefined,
    intentCount,
    arrivalCount,
  });
});

// GET /venues/:id/incentive — return the active incentive for a venue (public)
router.get('/:id/incentive', async (req: Request, res: Response) => {
  const incentive = await prisma.venueIncentive.findFirst({
    where: { venueId: req.params.id, active: true },
    select: { id: true, venueId: true, title: true, description: true, expiresAt: true, active: true, createdAt: true },
  });

  if (!incentive) {
    res.status(404).json({ error: 'No active incentive for this venue' });
    return;
  }

  res.json(incentive);
});

export default router;
