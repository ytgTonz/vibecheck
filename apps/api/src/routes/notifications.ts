import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validateBody, asyncHandler } from '../middleware/validate';

const router = Router();

const PAGE_SIZE = 20;

const RegisterPushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.string().min(1, 'Platform is required'),
});

const UnregisterPushTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// POST /notifications/push-token — register a mobile push token (auth optional)
router.post('/push-token', optionalAuth, validateBody(RegisterPushTokenSchema), asyncHandler(async (req, res) => {
  const userId = req.user?.userId ?? undefined;
  const { token, platform } = req.body as z.infer<typeof RegisterPushTokenSchema>;

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId: userId ?? null },
    update: { platform, userId: userId ?? null },
  });

  res.status(201).json({ ok: true });
}));

// DELETE /notifications/push-token — unregister a push token (on logout)
router.delete('/push-token', requireAuth, validateBody(UnregisterPushTokenSchema), asyncHandler(async (req, res) => {
  const { token } = req.body as z.infer<typeof UnregisterPushTokenSchema>;

  await prisma.pushToken.deleteMany({ where: { token } });
  res.status(204).end();
}));

// GET /notifications — fetch notifications for the current user
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const unreadOnly = req.query.unreadOnly === 'true';

  const where = {
    OR: [
      { userId },
      { userId: null }, // broadcasts
    ],
    ...(unreadOnly ? { read: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({
    data: notifications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}));

// PATCH /notifications/:id/read — mark a notification as read
router.patch('/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.json({ ok: true });
}));

export default router;
