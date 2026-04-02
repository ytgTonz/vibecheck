import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { createToken } from '../../lib/livekit';

const router = Router();

// GET /streams/active — all LIVE streams with venue info
// Must be registered before /:id to prevent 'active' matching as an id
router.get('/active', async (_req: Request, res: Response) => {
  const streams = await prisma.liveStream.findMany({
    where: { status: 'LIVE' },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
    orderBy: { startedAt: 'desc' },
  });

  res.json(streams);
});

// GET /streams/venue/:venueId/recent — recent ended streams with attendance funnel counts
router.get('/venue/:venueId/recent', async (req: Request, res: Response) => {
  const streams = await prisma.liveStream.findMany({
    where: { venueId: req.params.venueId, status: 'ENDED' },
    orderBy: { endedAt: 'desc' },
    take: 10,
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
  });

  if (streams.length === 0) {
    res.json([]);
    return;
  }

  // Fetch attendance counts (INTENT + ARRIVAL) for all returned streams in one query
  const streamIds = streams.map((s) => s.id);
  const attendanceCounts = await prisma.streamAttendance.groupBy({
    by: ['streamId', 'type'],
    where: { streamId: { in: streamIds } },
    _count: { _all: true },
  });

  // Build a lookup: streamId → { intentCount, arrivalCount }
  const countMap: Record<string, { intentCount: number; arrivalCount: number }> = {};
  for (const row of attendanceCounts) {
    if (!countMap[row.streamId]) countMap[row.streamId] = { intentCount: 0, arrivalCount: 0 };
    if (row.type === 'INTENT') countMap[row.streamId].intentCount = row._count._all;
    if (row.type === 'ARRIVAL') countMap[row.streamId].arrivalCount = row._count._all;
  }

  const result = streams.map((s) => ({
    ...s,
    intentCount: countMap[s.id]?.intentCount ?? 0,
    arrivalCount: countMap[s.id]?.arrivalCount ?? 0,
  }));

  res.json(result);
});

// GET /streams/:id — stream details
router.get('/:id', async (req: Request, res: Response) => {
  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  res.json(stream);
});

// GET /streams/:id/viewer-token — anonymous viewer token
router.get('/:id/viewer-token', async (req: Request, res: Response) => {
  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  if (stream.status !== 'LIVE') {
    res.status(400).json({ error: 'Stream is not live' });
    return;
  }

  const identity = `viewer-${stream.id}-${randomUUID()}`;
  const token = await createToken(identity, stream.livekitRoom, {
    canPublish: false,
    name: 'Viewer',
  });

  res.json({ token });
});

export default router;
