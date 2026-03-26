import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { emitAttendanceUpdate } from '../lib/socket';
import { AuthPayload } from '../middleware/auth';

const router = Router();

/** Optionally parse a Bearer token and attach user to req. */
function tryAuth(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ') || !process.env.JWT_SECRET) return null;
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

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

  const user = tryAuth(req);

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
        userId: user?.userId ?? null,
        type: 'INTENT',
      },
    });

    // Schedule reminder push notification for authenticated users
    if (user?.userId) {
      const delayMinutes = 30 + Math.floor(Math.random() * 31); // 30–60 mins
      const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
      await prisma.scheduledNotification.create({
        data: {
          targetUserId: user.userId,
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

  const user = tryAuth(req);

  const existing = await prisma.streamAttendance.findUnique({
    where: { deviceId_streamId_type: { deviceId, streamId, type: 'ARRIVAL' } },
  });

  if (!existing) {
    await prisma.streamAttendance.create({
      data: {
        streamId,
        venueId: stream.venueId,
        deviceId,
        userId: user?.userId ?? null,
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
