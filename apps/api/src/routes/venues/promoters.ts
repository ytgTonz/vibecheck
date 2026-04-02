import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { isVenueOwner } from '../../lib/venueAuth';

const INVITE_EXPIRY_DAYS = 7;

const router = Router();

// POST /venues/:id/invite — generate an invite code (owner only)
router.post('/:id/invite', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  if (!(await isVenueOwner(userId, id))) {
    res.status(403).json({ error: 'Only the venue owner can generate invite codes' });
    return;
  }

  const code = randomUUID().slice(0, 8).toUpperCase();
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
