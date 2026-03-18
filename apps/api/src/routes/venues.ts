import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { isVenueOwner } from '../lib/venueAuth';

const router = Router();

const INVITE_EXPIRY_DAYS = 7;

// ─── Public routes ───────────────────────────────────────────────────────────

// GET /venues — return all venues with their latest clip timestamp
router.get('/', async (_req: Request, res: Response) => {
  const venues = await prisma.venue.findMany({
    orderBy: { name: 'asc' },
    include: {
      clips: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  // Flatten: add lastClipAt field, remove nested clips array
  const result = venues.map(({ clips, ...venue }) => ({
    ...venue,
    lastClipAt: clips[0]?.createdAt ?? null,
  }));

  res.json(result);
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

  res.json(venue);
});

// GET /venues/:id/clips — return all clips for a venue
router.get('/:id/clips', async (req: Request, res: Response) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
  });

  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  const clips = await prisma.clip.findMany({
    where: { venueId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(clips);
});

// ─── Protected routes ────────────────────────────────────────────────────────

// GET /venues/my/venues — return venues the user owns or is a promoter for, with stats
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
      clips: {
        select: {
          id: true,
          views: true,
          createdAt: true,
          caption: true,
          thumbnail: true,
          duration: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Calculate stats for each venue
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const result = venues.map(({ clips, ...venue }) => ({
    ...venue,
    stats: {
      totalClips: clips.length,
      totalViews: clips.reduce((sum, c) => sum + c.views, 0),
      clipsThisWeek: clips.filter((c) => new Date(c.createdAt) >= weekAgo).length,
    },
    recentClips: clips.slice(0, 5),
  }));

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

export default router;
