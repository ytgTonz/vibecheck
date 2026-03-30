import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { isVenueOwner } from '../../lib/venueAuth';
import { sendNotification } from '../../lib/notifications';
import { validateBody, asyncHandler } from '../../middleware/validate';

const router = Router();

const VENUE_TYPES = ['NIGHTCLUB', 'BAR', 'RESTAURANT_BAR', 'LOUNGE', 'SHISA_NYAMA', 'ROOFTOP', 'OTHER'] as const;

const CreateVenueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  type: z.enum(VENUE_TYPES, { message: `type must be one of: ${VENUE_TYPES.join(', ')}` }),
  location: z.string().min(1, 'Location is required'),
  hours: z.string().optional(),
  musicGenre: z.array(z.string()).optional(),
  coverCharge: z.string().optional(),
  drinkPrices: z.string().optional(),
});

const PatchVenueSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(VENUE_TYPES, { message: `type must be one of: ${VENUE_TYPES.join(', ')}` }).optional(),
  location: z.string().min(1).optional(),
  hours: z.string().optional(),
  musicGenre: z.array(z.string()).optional(),
  coverCharge: z.string().optional(),
  drinkPrices: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'No valid fields to update' });

// GET /venues/my/venues — return venues the user owns or is a promoter for
router.get('/my/venues', requireAuth, asyncHandler(async (req, res) => {
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
}));

// POST /venues — create a new venue (venue owners only)
router.post('/', requireAuth, requireRole('VENUE_OWNER'), validateBody(CreateVenueSchema), asyncHandler(async (req, res) => {
  const { name, type, location, hours, musicGenre, coverCharge, drinkPrices } = req.body as z.infer<typeof CreateVenueSchema>;

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
}));

// PATCH /venues/:id — update venue details (owner only)
router.patch('/:id', requireAuth, validateBody(PatchVenueSchema), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can edit venue details' });
    return;
  }

  const updated = await prisma.venue.update({
    where: { id },
    data: req.body as z.infer<typeof PatchVenueSchema>,
  });

  res.json(updated);
}));

export default router;
