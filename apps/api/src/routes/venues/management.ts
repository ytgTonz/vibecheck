import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { isVenueOwner } from '../../lib/venueAuth';
import { sendNotification } from '../../lib/notifications';

const ALLOWED_FIELDS = ['name', 'type', 'location', 'hours', 'musicGenre', 'coverCharge', 'drinkPrices'] as const;

const router = Router();

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

// PATCH /venues/:id — update venue details (owner only)
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
