import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

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

// POST /venues/:id/claim — claim a venue as owner (auth required)
router.post('/:id/claim', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Check venue exists
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Check not already claimed
  if (venue.claimedBy) {
    res.status(409).json({ error: 'This venue has already been claimed' });
    return;
  }

  // Claim the venue and promote user to VENUE_OWNER in a transaction
  const [updatedVenue] = await prisma.$transaction([
    prisma.venue.update({
      where: { id },
      data: { claimedBy: userId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { role: 'VENUE_OWNER' },
    }),
  ]);

  res.json(updatedVenue);
});

export default router;
