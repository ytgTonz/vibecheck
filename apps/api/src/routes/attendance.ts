import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { emitAttendanceUpdate } from '../lib/socket';
import { validateBody, asyncHandler } from '../middleware/validate';

const router = Router();

const AttendanceBodySchema = z.object({
  streamId: z.string().min(1, 'streamId is required'),
  deviceId: z.string().min(1, 'deviceId is required'),
});

async function getAttendanceCounts(streamId: string) {
  const [intentCount, arrivalCount] = await Promise.all([
    prisma.streamAttendance.count({ where: { streamId, type: 'INTENT' } }),
    prisma.streamAttendance.count({ where: { streamId, type: 'ARRIVAL' } }),
  ]);
  return { intentCount, arrivalCount };
}

/** POST /attendance/intent — record "I'm Coming" */
router.post('/intent', optionalAuth, validateBody(AttendanceBodySchema), asyncHandler(async (req, res) => {
  const { streamId, deviceId } = req.body as z.infer<typeof AttendanceBodySchema>;

  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
    include: { venue: { select: { id: true, name: true } } },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  const userId = req.user?.userId ?? null;

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
}));

/** POST /attendance/arrival — record "I'm Here" */
router.post('/arrival', optionalAuth, validateBody(AttendanceBodySchema), asyncHandler(async (req, res) => {
  const { streamId, deviceId } = req.body as z.infer<typeof AttendanceBodySchema>;

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
}));

/** GET /attendance/:streamId/counts */
router.get('/:streamId/counts', asyncHandler(async (req, res) => {
  const { streamId } = req.params;
  const counts = await getAttendanceCounts(streamId);
  res.json(counts);
}));

export default router;
