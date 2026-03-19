import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  deleteUserWithCascade,
  deleteVenueWithCascade,
  deleteClipWithCleanup,
  AdminDeleteError,
} from '../lib/adminHelpers';

const router = Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// Shared select to exclude password from user queries
const userSelectNoPassword = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;

/** Parse pagination params with defaults. */
function parsePagination(query: Request['query']) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// GET /admin/stats — platform overview
router.get('/stats', async (_req: Request, res: Response) => {
  const [userCount, venueCount, clipCount, feedbackCount, usersByRole, recentUsers, recentVenues, recentClips] =
    await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.clip.count(),
      prisma.feedback.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: userSelectNoPassword,
      }),
      prisma.venue.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.clip.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  res.json({
    counts: {
      users: userCount,
      venues: venueCount,
      clips: clipCount,
      feedback: feedbackCount,
    },
    usersByRole: usersByRole.map((r) => ({
      role: r.role,
      count: r._count.role,
    })),
    recentUsers,
    recentVenues,
    recentClips,
  });
});

// GET /admin/feedback — paginated feedback with user info
router.get('/feedback', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const validCategories = ['BUG', 'SUGGESTION', 'GENERAL'];
  const validRatings = ['BAD', 'NEUTRAL', 'GOOD'];

  const where: Record<string, string> = {};
  if (req.query.category && typeof req.query.category === 'string') {
    if (!validCategories.includes(req.query.category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
      return;
    }
    where.category = req.query.category;
  }
  if (req.query.rating && typeof req.query.rating === 'string') {
    if (!validRatings.includes(req.query.rating)) {
      res.status(400).json({ error: `Invalid rating. Must be one of: ${validRatings.join(', ')}` });
      return;
    }
    where.rating = req.query.rating;
  }

  const [data, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.feedback.count({ where }),
  ]);

  res.json({ data, total, page, limit });
});

// GET /admin/users — paginated users with counts
router.get('/users', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        ...userSelectNoPassword,
        _count: {
          select: {
            ownedVenues: true,
            venueLinks: true,
            feedback: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  res.json({ data, total, page, limit });
});

// DELETE /admin/users/:id — delete user with cascade
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await deleteUserWithCascade(req.params.id, req.user!.userId);
    res.status(204).end();
  } catch (err) {
    if (err instanceof AdminDeleteError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

// GET /admin/venues — paginated venues with owner info and counts
router.get('/venues', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    prisma.venue.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            clips: true,
            promoters: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.venue.count(),
  ]);

  res.json({ data, total, page, limit });
});

// DELETE /admin/venues/:id — delete venue with cascade
router.delete('/venues/:id', async (req: Request, res: Response) => {
  const venue = await prisma.venue.findUnique({ where: { id: req.params.id } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  await deleteVenueWithCascade(req.params.id);
  res.status(204).end();
});

// GET /admin/clips — paginated clips with venue info and uploader lookup
router.get('/clips', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [data, total] = await Promise.all([
    prisma.clip.findMany({
      include: {
        venue: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.clip.count(),
  ]);

  // Batch-lookup uploaders (uploadedBy may be a seed placeholder)
  const uploaderIds = [...new Set(data.map((c) => c.uploadedBy))];
  const uploaders = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true, email: true },
  });
  const uploaderMap = new Map(uploaders.map((u) => [u.id, u]));

  const enrichedData = data.map((clip) => ({
    ...clip,
    uploader: uploaderMap.get(clip.uploadedBy) || null,
  }));

  res.json({ data: enrichedData, total, page, limit });
});

// DELETE /admin/clips/:id — delete clip with cleanup
router.delete('/clips/:id', async (req: Request, res: Response) => {
  try {
    await deleteClipWithCleanup(req.params.id);
    res.status(204).end();
  } catch (err) {
    if (err instanceof AdminDeleteError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
