import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { isVenueMember, isVenueOwner } from '../../lib/venueAuth';
import { createToken, roomService } from '../../lib/livekit';
import { emitStreamStarted, emitStreamLive, emitStreamEnded } from '../../lib/socket';
import { sendNotification } from '../../lib/notifications';
import { validateBody, asyncHandler } from '../../middleware/validate';

const STALE_IDLE_STREAM_MS = 60 * 60 * 1000;

const router = Router();

const CreateStreamSchema = z.object({
  venueId: z.string().min(1, 'venueId is required'),
});

// POST /streams — create a new stream for a venue
router.post('/', requireAuth, validateBody(CreateStreamSchema), asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const { venueId } = req.body as z.infer<typeof CreateStreamSchema>;

  if (!(await isVenueMember(userId, venueId))) {
    res.status(403).json({ error: 'Not authorized for this venue' });
    return;
  }

  const staleBefore = new Date(Date.now() - STALE_IDLE_STREAM_MS);

  await prisma.liveStream.updateMany({
    where: {
      venueId,
      status: 'IDLE',
      createdAt: { lt: staleBefore },
    },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
    },
  });

  const existing = await prisma.liveStream.findFirst({
    where: { venueId, status: { in: ['IDLE', 'LIVE'] } },
  });

  if (existing) {
    res.status(409).json({ error: 'Venue already has an active stream' });
    return;
  }

  const roomName = `venue-${venueId}-${Date.now()}`;

  try {
    const stream = await prisma.liveStream.create({
      data: {
        venueId,
        livekitRoom: roomName,
        status: 'IDLE',
        createdBy: userId,
      },
      include: {
        venue: { select: { id: true, name: true, type: true, location: true } },
      },
    });

    emitStreamStarted({ venueId, streamId: stream.id });
    res.status(201).json(stream);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      res.status(409).json({ error: 'Venue already has an active stream' });
      return;
    }
    throw err;
  }
}));

// POST /streams/:id/token — broadcaster token (creator only)
router.post('/:id/token', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  if (stream.createdBy !== userId) {
    res.status(403).json({ error: 'Only the stream creator can broadcast' });
    return;
  }

  const token = await createToken(userId, stream.livekitRoom, {
    canPublish: true,
    name: 'Broadcaster',
  });

  res.json({ token });
}));

// POST /streams/:id/go-live — broadcaster confirms media is published
router.post('/:id/go-live', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  if (stream.createdBy !== userId) {
    res.status(403).json({ error: 'Only the stream creator can go live' });
    return;
  }

  if (stream.status === 'LIVE') {
    res.json(stream);
    return;
  }

  if (stream.status === 'ENDED') {
    res.status(400).json({ error: 'Stream has already ended' });
    return;
  }

  const updated = await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'LIVE', startedAt: new Date() },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true, ownerId: true } },
    },
  });

  emitStreamLive({ venueId: stream.venueId, streamId: stream.id });

  sendNotification({
    type: 'STREAM_LIVE',
    title: `${updated.venue!.name} just went live`,
    body: 'Tune in now to see the vibe!',
    data: { venueId: stream.venueId, streamId: stream.id },
  });
  if (updated.venue!.ownerId !== userId) {
    sendNotification({
      type: 'STREAM_LIVE',
      title: `Your venue ${updated.venue!.name} is now live`,
      body: 'A promoter started streaming at your venue.',
      data: { venueId: stream.venueId, streamId: stream.id },
      targetUserId: updated.venue!.ownerId,
    });
  }

  res.json(updated);
}));

// POST /streams/:id/end — end a stream (creator or venue owner)
router.post('/:id/end', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;

  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  if (stream.status === 'ENDED') {
    res.status(400).json({ error: 'Stream already ended' });
    return;
  }

  const isCreator = stream.createdBy === userId;
  const isAdmin = req.user!.role === 'ADMIN';
  const ownerCheck = await isVenueOwner(userId, stream.venueId);

  if (!isCreator && !ownerCheck && !isAdmin) {
    res.status(403).json({ error: 'Not authorized to end this stream' });
    return;
  }

  try {
    await roomService.deleteRoom(stream.livekitRoom);
  } catch {
    // Room may not exist yet or already deleted
  }

  const updated = await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'ENDED', endedAt: new Date() },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
  });

  emitStreamEnded({ venueId: stream.venueId, streamId: stream.id });
  sendNotification({
    type: 'STREAM_ENDED',
    title: `Stream ended at ${updated.venue!.name}`,
    body: `Peak viewers: ${updated.viewerPeak}`,
    data: { venueId: stream.venueId, streamId: stream.id },
    targetRole: 'ADMIN',
  });
  res.json(updated);
}));

export default router;
