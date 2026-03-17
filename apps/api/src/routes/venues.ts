import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /venues — return all venues
router.get('/', async (_req: Request, res: Response) => {
  const venues = await prisma.venue.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(venues);
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

export default router;
