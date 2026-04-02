import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { VALID_CATEGORIES, VALID_RATINGS } from '../lib/constants';

const router = Router();

/** POST /feedback — Submit feedback (authenticated). */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, rating, message } = req.body;
    const userId = req.user!.userId;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }

    if (!rating || !VALID_RATINGS.includes(rating)) {
      res.status(400).json({ error: `rating must be one of: ${VALID_RATINGS.join(', ')}` });
      return;
    }

    const feedback = await prisma.feedback.create({
      data: {
        category,
        rating,
        message: message?.trim() || null,
        userId,
      },
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error('Failed to submit feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
