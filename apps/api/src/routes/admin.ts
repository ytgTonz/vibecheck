import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  deleteUserWithCascade,
  deleteVenueWithCascade,
  AdminDeleteError,
} from '../lib/adminHelpers';
import { VALID_CATEGORIES, VALID_RATINGS, VALID_ROLES, VALID_VENUE_TYPES } from '../lib/constants';

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

function getQueryString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// GET /admin/stats — platform overview
router.get('/stats', async (_req: Request, res: Response) => {
  const [userCount, venueCount, feedbackCount, activeStreamCount, usersByRole, recentUsers, recentVenues] =
    await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.feedback.count(),
      prisma.liveStream.count({ where: { status: 'LIVE' } }),
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
    ]);

  res.json({
    counts: {
      users: userCount,
      venues: venueCount,
      feedback: feedbackCount,
      activeStreams: activeStreamCount,
    },
    usersByRole: usersByRole.map((r) => ({
      role: r.role,
      count: r._count.role,
    })),
    recentUsers,
    recentVenues,
  });
});

// GET /admin/feedback — paginated feedback with user info
router.get('/feedback', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const category = getQueryString(req.query.category);
  const rating = getQueryString(req.query.rating);
  const search = getQueryString(req.query.query);

  if (category && !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    return;
  }

  if (rating && !VALID_RATINGS.includes(rating as typeof VALID_RATINGS[number])) {
    res.status(400).json({ error: `Invalid rating. Must be one of: ${VALID_RATINGS.join(', ')}` });
    return;
  }

  const conditions: Record<string, unknown>[] = [];
  if (category) {
    conditions.push({ category });
  }
  if (rating) {
    conditions.push({ rating });
  }
  if (search) {
    conditions.push({
      OR: [
        { message: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

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
  const search = getQueryString(req.query.query);
  const role = getQueryString(req.query.role);

  if (role && !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    return;
  }

  const conditions: Record<string, unknown>[] = [];
  if (role) {
    conditions.push({ role });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
    prisma.user.count({ where }),
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
  const search = getQueryString(req.query.query);
  const type = getQueryString(req.query.type);

  if (type && !VALID_VENUE_TYPES.includes(type as typeof VALID_VENUE_TYPES[number])) {
    res.status(400).json({ error: `Invalid venue type. Must be one of: ${VALID_VENUE_TYPES.join(', ')}` });
    return;
  }

  const conditions: Record<string, unknown>[] = [];
  if (type) {
    conditions.push({ type });
  }
  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [data, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            promoters: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.venue.count({ where }),
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

export default router;
