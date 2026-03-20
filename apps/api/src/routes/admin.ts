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

const validCategories = ['BUG', 'SUGGESTION', 'GENERAL'] as const;
const validRatings = ['BAD', 'NEUTRAL', 'GOOD'] as const;
const validRoles = ['ADMIN', 'VENUE_OWNER', 'VENUE_PROMOTER'] as const;
const validVenueTypes = ['NIGHTCLUB', 'BAR', 'RESTAURANT_BAR', 'LOUNGE', 'SHISA_NYAMA', 'ROOFTOP', 'OTHER'] as const;

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

async function enrichClipsWithUploaders<T extends { uploadedBy: string }>(clips: T[]) {
  const uploaderIds = [...new Set(clips.map((clip) => clip.uploadedBy))];
  const uploaders = await prisma.user.findMany({
    where: { id: { in: uploaderIds } },
    select: { id: true, name: true, email: true },
  });
  const uploaderMap = new Map(uploaders.map((u) => [u.id, u]));

  return clips.map((clip) => ({
    ...clip,
    uploader: uploaderMap.get(clip.uploadedBy) || null,
  }));
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
        include: {
          venue: { select: { id: true, name: true } },
        },
      }),
    ]);

  const recentClipsWithUploaders = await enrichClipsWithUploaders(recentClips);

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
    recentClips: recentClipsWithUploaders,
  });
});

// GET /admin/feedback — paginated feedback with user info
router.get('/feedback', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const category = getQueryString(req.query.category);
  const rating = getQueryString(req.query.rating);
  const search = getQueryString(req.query.query);

  if (category && !validCategories.includes(category as typeof validCategories[number])) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    return;
  }

  if (rating && !validRatings.includes(rating as typeof validRatings[number])) {
    res.status(400).json({ error: `Invalid rating. Must be one of: ${validRatings.join(', ')}` });
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

  if (role && !validRoles.includes(role as typeof validRoles[number])) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
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

  if (type && !validVenueTypes.includes(type as typeof validVenueTypes[number])) {
    res.status(400).json({ error: `Invalid venue type. Must be one of: ${validVenueTypes.join(', ')}` });
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
            clips: true,
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

// GET /admin/clips — paginated clips with venue info and uploader lookup
router.get('/clips', async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const search = getQueryString(req.query.query);

  let uploaderIds: string[] = [];
  if (search) {
    const matchedUploaders = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    uploaderIds = matchedUploaders.map((user) => user.id);
  }

  const clipSearchConditions: Record<string, unknown>[] = [];
  if (search) {
    clipSearchConditions.push(
      { caption: { contains: search, mode: 'insensitive' as const } },
      { venue: { name: { contains: search, mode: 'insensitive' as const } } },
    );
    if (uploaderIds.length > 0) {
      clipSearchConditions.push({ uploadedBy: { in: uploaderIds } });
    }
  }

  const where = clipSearchConditions.length > 0 ? { OR: clipSearchConditions } : {};

  const [data, total] = await Promise.all([
    prisma.clip.findMany({
      where,
      include: {
        venue: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.clip.count({ where }),
  ]);

  const enrichedData = await enrichClipsWithUploaders(data);

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
