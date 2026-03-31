import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { isVenueOwner } from '../lib/venueAuth';

const router = Router();

// POST /incentives — create a new active incentive for a venue
// Deactivates any existing active incentive transactionally.
router.post('/', requireAuth, requireRole('VENUE_OWNER', 'ADMIN'), async (req: Request, res: Response) => {
  const { venueId, title, description, expiresAt } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!venueId || !title || !description) {
    res.status(400).json({ error: 'venueId, title, and description are required' });
    return;
  }

  // Verify the caller owns this venue
  if (userRole !== 'ADMIN' && !(await isVenueOwner(userId, venueId))) {
    res.status(403).json({ error: 'Only the venue owner can manage incentives' });
    return;
  }

  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Deactivate existing active incentive and create new one transactionally
  const [, incentive] = await prisma.$transaction([
    prisma.venueIncentive.updateMany({
      where: { venueId, active: true },
      data: { active: false },
    }),
    prisma.venueIncentive.create({
      data: {
        venueId,
        title,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    }),
  ]);

  res.status(201).json(incentive);
});

// PATCH /incentives/:id — update an existing incentive
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const { title, description, expiresAt, active } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const incentive = await prisma.venueIncentive.findUnique({
    where: { id: req.params.id },
    select: { id: true, venueId: true },
  });

  if (!incentive) {
    res.status(404).json({ error: 'Incentive not found' });
    return;
  }

  // Verify the caller owns the venue this incentive belongs to
  if (userRole !== 'ADMIN' && !(await isVenueOwner(userId, incentive.venueId))) {
    res.status(403).json({ error: 'Only the venue owner can update incentives' });
    return;
  }

  const updated = await prisma.venueIncentive.update({
    where: { id: incentive.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      ...(active !== undefined && { active }),
    },
  });

  res.json(updated);
});

export default router;
