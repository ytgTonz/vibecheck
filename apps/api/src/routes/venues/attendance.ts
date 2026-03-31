import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { isVenueMember } from '../../lib/venueAuth';

const router = Router();

// GET /venues/:id/attendance-summary — per-stream, per-day aggregates for billing export
router.get('/:id/attendance-summary', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueMember(userId, id))) {
    res.status(403).json({ error: 'Only venue owners and promoters can access attendance summaries' });
    return;
  }

  const venue = await prisma.venue.findUnique({ where: { id }, select: { id: true } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Optional date range — default to last 30 days
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const from = req.query.from
    ? new Date(req.query.from as string)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    res.status(400).json({ error: 'Invalid date format — use ISO 8601 (e.g. 2026-03-01)' });
    return;
  }

  // Fetch all streams for this venue in the date range
  const streams = await prisma.liveStream.findMany({
    where: {
      venueId: id,
      startedAt: { gte: from, lte: to },
    },
    select: { id: true, startedAt: true, endedAt: true },
    orderBy: { startedAt: 'asc' },
  });

  if (streams.length === 0) {
    res.json({ venueId: id, from, to, days: [], totals: { intent: 0, arrival: 0, streams: 0 } });
    return;
  }

  // Count intent and arrival per stream in one query
  const streamIds = streams.map((s) => s.id);
  const attendanceCounts = await prisma.streamAttendance.groupBy({
    by: ['streamId', 'type'],
    where: { streamId: { in: streamIds } },
    _count: { _all: true },
  });

  // Build a map: streamId → { intentCount, arrivalCount }
  const countMap = new Map<string, { intentCount: number; arrivalCount: number }>();
  for (const row of attendanceCounts) {
    const entry = countMap.get(row.streamId) ?? { intentCount: 0, arrivalCount: 0 };
    if (row.type === 'INTENT') entry.intentCount = row._count._all;
    if (row.type === 'ARRIVAL') entry.arrivalCount = row._count._all;
    countMap.set(row.streamId, entry);
  }

  type StreamEntry = { streamId: string; startedAt: Date | null; endedAt: Date | null; intentCount: number; arrivalCount: number };
  type DayEntry = { date: string; streams: StreamEntry[]; totalIntent: number; totalArrival: number };

  // Group streams by calendar day (UTC date string)
  const dayMap = new Map<string, StreamEntry[]>();
  for (const stream of streams) {
    const day = (stream.startedAt ?? new Date()).toISOString().slice(0, 10);
    if (!dayMap.has(day)) dayMap.set(day, []);
    const { intentCount = 0, arrivalCount = 0 } = countMap.get(stream.id) ?? {};
    dayMap.get(day)!.push({ streamId: stream.id, startedAt: stream.startedAt, endedAt: stream.endedAt, intentCount, arrivalCount });
  }

  const days: DayEntry[] = [...dayMap.entries()].map(([date, dayStreams]) => ({
    date,
    streams: dayStreams,
    totalIntent: dayStreams.reduce((sum: number, s: StreamEntry) => sum + s.intentCount, 0),
    totalArrival: dayStreams.reduce((sum: number, s: StreamEntry) => sum + s.arrivalCount, 0),
  }));

  const totals = {
    intent: days.reduce((sum: number, d: DayEntry) => sum + d.totalIntent, 0),
    arrival: days.reduce((sum: number, d: DayEntry) => sum + d.totalArrival, 0),
    streams: streams.length,
  };

  res.json({ venueId: id, from, to, days, totals });
});

// GET /venues/:id/visit-stats — coming / arrived / claimed counts for dashboard
router.get('/:id/visit-stats', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!(await isVenueMember(userId, id, userRole))) {
    res.status(403).json({ error: 'Only venue members can access visit stats' });
    return;
  }

  const venue = await prisma.venue.findUnique({ where: { id }, select: { id: true } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  const [comingCount, arrivedCount, claimedCount] = await Promise.all([
    prisma.venueVisit.count({ where: { venueId: id, intentAt: { not: null } } }),
    prisma.venueVisit.count({ where: { venueId: id, arrivedAt: { not: null } } }),
    prisma.attendanceQRToken.count({ where: { venueId: id, usedAt: { not: null } } }),
  ]);

  res.json({ venueId: id, comingCount, arrivedCount, claimedCount });
});

export default router;
