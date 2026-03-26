import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { sendNotification } from '../lib/notifications';
import { isVenueOwner, isVenueMember } from '../lib/venueAuth';
import { computeVibeScore } from '../lib/vibeScore';

const router = Router();

const INVITE_EXPIRY_DAYS = 7;

// ─── Public routes ───────────────────────────────────────────────────────────

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

// ─── Protected routes ────────────────────────────────────────────────────────

// POST /venues — create a new venue (venue owners only)
router.post('/', requireAuth, requireRole('VENUE_OWNER'), async (req: Request, res: Response) => {
  const { name, type, location, hours, musicGenre, coverCharge, drinkPrices } = req.body;

  if (!name || !type || !location) {
    res.status(400).json({ error: 'Venue name, type, and location are required' });
    return;
  }

  const venue = await prisma.venue.create({
    data: {
      name,
      type,
      location,
      hours: hours ?? null,
      musicGenre: musicGenre ?? [],
      coverCharge: coverCharge ?? null,
      drinkPrices: drinkPrices ?? null,
      ownerId: req.user!.userId,
    },
  });

  // Broadcast to all users + admin
  sendNotification({
    type: 'VENUE_CREATED',
    title: `New venue: ${venue.name} just joined VibeCheck`,
    body: `Check out ${venue.name} in ${venue.location}`,
    data: { venueId: venue.id },
  });
  sendNotification({
    type: 'VENUE_CREATED',
    title: `New venue: ${venue.name}`,
    body: `Added by ${req.user!.userId} in ${venue.location}`,
    data: { venueId: venue.id },
    targetRole: 'ADMIN',
  });

  res.status(201).json(venue);
});

// GET /venues/my/venues — return venues the user owns or is a promoter for
router.get('/my/venues', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const venues = await prisma.venue.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { promoters: { some: { userId } } },
      ],
    },
    include: {
      streams: {
        where: { status: 'LIVE' },
        select: { id: true, currentViewerCount: true },
        take: 1,
      },
    },
  });

  const result = venues.map(({ streams, ...venue }) => {
    const activeStream = streams[0] ?? null;
    return {
      ...venue,
      isLive: !!activeStream,
      activeStreamId: activeStream?.id ?? undefined,
      currentViewerCount: activeStream?.currentViewerCount ?? 0,
    };
  });

  res.json(result);
});

// POST /venues/:id/invite — generate an invite code (owner only)
router.post('/:id/invite', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can generate invite codes' });
    return;
  }

  const code = crypto.randomUUID().slice(0, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      code,
      venueId: id,
      createdBy: userId,
      expiresAt,
    },
  });

  res.status(201).json(invite);
});

// GET /venues/:id/promoters — list promoters for a venue (owner only)
router.get('/:id/promoters', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can view promoters' });
    return;
  }

  const promoters = await prisma.venuePromoter.findMany({
    where: { venueId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(promoters);
});

// DELETE /venues/:id/promoters/:userId — remove a promoter (owner only)
router.delete('/:id/promoters/:userId', requireAuth, async (req: Request, res: Response) => {
  const { id, userId: promoterUserId } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can remove promoters' });
    return;
  }

  const deleted = await prisma.venuePromoter.deleteMany({
    where: { venueId: id, userId: promoterUserId },
  });

  if (deleted.count === 0) {
    res.status(404).json({ error: 'Promoter not found for this venue' });
    return;
  }

  res.status(204).end();
});

// PATCH /venues/:id — update venue details (owner only)
const ALLOWED_FIELDS = ['name', 'type', 'location', 'hours', 'musicGenre', 'coverCharge', 'drinkPrices'] as const;

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can edit venue details' });
    return;
  }

  // Pick only allowed fields from the request body
  const data: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (req.body[field] !== undefined) {
      data[field] = req.body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const updated = await prisma.venue.update({
    where: { id },
    data,
  });

  res.json(updated);
});

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

export default router;
