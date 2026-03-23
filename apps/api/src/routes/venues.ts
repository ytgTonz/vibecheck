import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { isVenueOwner } from '../lib/venueAuth';

const router = Router();

const INVITE_EXPIRY_DAYS = 7;

// ─── Public routes ───────────────────────────────────────────────────────────

// GET /venues — return all venues, live first then alphabetical
router.get('/', async (_req: Request, res: Response) => {
  const [venues, activeStreams] = await Promise.all([
    prisma.venue.findMany(),
    prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      select: { id: true, venueId: true },
    }),
  ]);

  const liveMap = new Map(activeStreams.map((s) => [s.venueId, s.id]));

  const enriched = venues.map((venue) => {
    const activeStreamId = liveMap.get(venue.id);
    return {
      ...venue,
      isLive: !!activeStreamId,
      activeStreamId: activeStreamId ?? undefined,
    };
  });

  // Live venues first, then alphabetical
  enriched.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
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

  res.json({
    ...venue,
    isLive: !!activeStream,
    activeStreamId: activeStream?.id ?? undefined,
  });
});

// ─── Protected routes ────────────────────────────────────────────────────────

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

export default router;
