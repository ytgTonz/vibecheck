import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const PAGE_SIZE = 20;

// POST /notifications/push-token — register a mobile push token
router.post('/push-token', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { token, platform } = req.body;

  if (!token || !platform) {
    res.status(400).json({ error: 'Token and platform are required' });
    return;
  }

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId },
    update: { userId, platform },
  });

  res.status(201).json({ ok: true });
});

// DELETE /notifications/push-token — unregister a push token (on logout)
router.delete('/push-token', requireAuth, async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  await prisma.pushToken.deleteMany({ where: { token } });
  res.status(204).end();
});

// GET /notifications — fetch notifications for the current user
router.get('/', requireAuth, async (req: Request, res: Response) => {
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
});

// PATCH /notifications/:id/read — mark a notification as read
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
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
});

export default router;
