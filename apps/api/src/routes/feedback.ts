import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validateBody, asyncHandler } from '../middleware/validate';

const router = Router();

const FeedbackSchema = z.object({
  category: z.enum(['BUG', 'SUGGESTION', 'GENERAL'], {
    message: 'category must be one of: BUG, SUGGESTION, GENERAL',
  }),
  rating: z.enum(['BAD', 'NEUTRAL', 'GOOD'], {
    message: 'rating must be one of: BAD, NEUTRAL, GOOD',
  }),
  message: z.string().optional(),
});

/** POST /feedback — Submit feedback (authenticated). */
router.post('/', requireAuth, validateBody(FeedbackSchema), asyncHandler(async (req, res) => {
  const { category, rating, message } = req.body as z.infer<typeof FeedbackSchema>;
  const userId = req.user!.userId;

  const feedback = await prisma.feedback.create({
    data: {
      category,
      rating,
      message: message?.trim() || null,
      userId,
    },
  });

  res.status(201).json(feedback);
}));

export default router;
