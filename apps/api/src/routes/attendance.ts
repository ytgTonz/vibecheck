import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { emitAttendanceUpdate } from '../lib/socket';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Attach req.user if a valid token is present, but never reject unauthenticated requests.
// This replaces the old per-handler tryAuth() — auth logic stays in one place (middleware/auth.ts).
router.use(optionalAuth);

async function getAttendanceCounts(streamId: string) {
  const [intentCount, arrivalCount] = await Promise.all([
    prisma.streamAttendance.count({ where: { streamId, type: 'INTENT' } }),
    prisma.streamAttendance.count({ where: { streamId, type: 'ARRIVAL' } }),
  ]);
  return { intentCount, arrivalCount };
}

/** POST /attendance/intent — record "I'm Coming" */
router.post('/intent', async (req: Request, res: Response) => {
  const { streamId, deviceId } = req.body as { streamId?: string; deviceId?: string };

  if (!streamId || !deviceId) {
    res.status(400).json({ error: 'streamId and deviceId are required' });
    return;
  }

  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    include: { venue: { select: { id: true, name: true } } },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  // req.user is set by optionalAuth middleware — present only if the caller sent a valid JWT.
  const userId = req.user?.userId ?? null;

  // Upsert — idempotent, no error on duplicate
  const existing = await prisma.streamAttendance.findUnique({
    where: { deviceId_streamId_type: { deviceId, streamId, type: 'INTENT' } },
  });

  if (!existing) {
    await prisma.streamAttendance.create({
      data: {
        streamId,
        venueId: stream.venueId,
        deviceId,
        userId,
        type: 'INTENT',
      },
    });

    // Schedule reminder push notification for authenticated users
    if (userId) {
      const delayMinutes = 30 + Math.floor(Math.random() * 31); // 30–60 mins
      const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
      await prisma.scheduledNotification.create({
        data: {
          targetUserId: userId,
          title: `Don't forget — ${stream.venue.name} is live!`,
          body: 'Are you heading out?',
          data: { venueId: stream.venueId, streamId },
          scheduledFor,
        },
      });
    }
  }

  const counts = await getAttendanceCounts(streamId);
  emitAttendanceUpdate({ venueId: stream.venueId, streamId, ...counts });

  res.json({ ...counts, alreadyPressed: !!existing });
});

/** POST /attendance/arrival — record "I'm Here" */
router.post('/arrival', async (req: Request, res: Response) => {
  const { streamId, deviceId } = req.body as { streamId?: string; deviceId?: string };

  if (!streamId || !deviceId) {
    res.status(400).json({ error: 'streamId and deviceId are required' });
    return;
  }

  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    select: { venueId: true },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  const userId = req.user?.userId ?? null;

  const existing = await prisma.streamAttendance.findUnique({
    where: { deviceId_streamId_type: { deviceId, streamId, type: 'ARRIVAL' } },
  });

  if (!existing) {
    await prisma.streamAttendance.create({
      data: {
        streamId,
        venueId: stream.venueId,
        deviceId,
        userId,
        type: 'ARRIVAL',
      },
    });
  }

  const counts = await getAttendanceCounts(streamId);
  emitAttendanceUpdate({ venueId: stream.venueId, streamId, ...counts });

  res.json({ ...counts, alreadyPressed: !!existing });
});

/** GET /attendance/:streamId/counts */
router.get('/:streamId/counts', async (req: Request, res: Response) => {
  const { streamId } = req.params;
  const counts = await getAttendanceCounts(streamId);
  res.json(counts);
});

export default router;
