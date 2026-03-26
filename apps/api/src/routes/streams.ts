import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { isVenueMember, isVenueOwner } from '../lib/venueAuth';
import { createToken, roomService } from '../lib/livekit';
import { emitStreamStarted, emitStreamLive, emitStreamEnded } from '../lib/socket';
import { sendNotification } from '../lib/notifications';

const router = Router();
const STALE_IDLE_STREAM_MS = 60 * 60 * 1000;

// POST /streams/end-all — admin force-end all IDLE/LIVE streams
router.post('/end-all', requireAuth, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const active = await prisma.liveStream.findMany({
    where: { status: { in: ['IDLE', 'LIVE'] } },
  });

  for (const stream of active) {
    try {
      await roomService.deleteRoom(stream.livekitRoom);
    } catch {
      // Room may not exist
    }
  }

  const result = await prisma.liveStream.updateMany({
    where: { status: { in: ['IDLE', 'LIVE'] } },
    data: { status: 'ENDED', endedAt: new Date() },
  });

  console.log(`[Streams] admin force-ended ${result.count} stream(s)`);
  res.json({ ended: result.count });
});

// POST /streams — create a new stream for a venue
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { venueId } = req.body;

  if (!venueId) {
    res.status(400).json({ error: 'venueId is required' });
    return;
  }

  if (!(await isVenueMember(userId, venueId))) {
    res.status(403).json({ error: 'Not authorized for this venue' });
    return;
  }

  const staleBefore = new Date(Date.now() - STALE_IDLE_STREAM_MS);

  // Expire abandoned setup sessions before checking for an active stream.
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

  // Check for existing active stream
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

    console.log('[Streams] created stream:', stream.id, 'status:', stream.status, 'room:', stream.livekitRoom);
    emitStreamStarted({ venueId, streamId: stream.id });
    res.status(201).json(stream);
  } catch (err: unknown) {
    // Partial unique index violation — concurrent request created a stream
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
});

// GET /streams/active — all LIVE streams with venue info
router.get('/active', async (_req: Request, res: Response) => {
  const streams = await prisma.liveStream.findMany({
    where: { status: 'LIVE' },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
    orderBy: { startedAt: 'desc' },
  });

  res.json(streams);
});

// GET /streams/:id — stream details
router.get('/:id', async (req: Request, res: Response) => {
  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  res.json(stream);
});

// POST /streams/:id/token — broadcaster token (creator only)
router.post('/:id/token', requireAuth, async (req: Request, res: Response) => {
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
});

// POST /streams/:id/go-live — broadcaster confirms media is published
// Called by the broadcaster client once its local track is active.
// Also triggered by the track_published webhook as a backup.
router.post('/:id/go-live', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  console.log('[Streams] go-live request for stream:', req.params.id, 'by user:', userId);

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

  // Already live or ended — no-op / error
  if (stream.status === 'LIVE') {
    console.log('[Streams] go-live no-op — already LIVE');
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

  console.log('[Streams] go-live success — IDLE→LIVE, stream:', updated.id);
  emitStreamLive({ venueId: stream.venueId, streamId: stream.id });

  // Broadcast notification to all users
  sendNotification({
    type: 'STREAM_LIVE',
    title: `${updated.venue!.name} just went live`,
    body: 'Tune in now to see the vibe!',
    data: { venueId: stream.venueId, streamId: stream.id },
  });
  // Targeted notification to venue owner
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
});

// GET /streams/:id/viewer-token — anonymous viewer token
router.get('/:id/viewer-token', async (req: Request, res: Response) => {
  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.id },
  });

  if (!stream) {
    res.status(404).json({ error: 'Stream not found' });
    return;
  }

  if (stream.status !== 'LIVE') {
    res.status(400).json({ error: 'Stream is not live' });
    return;
  }

  const identity = `viewer-${stream.id}-${crypto.randomUUID()}`;
  const token = await createToken(identity, stream.livekitRoom, {
    canPublish: false,
    name: 'Viewer',
  });

  res.json({ token });
});

// POST /streams/:id/end — end a stream (creator or venue owner)
router.post('/:id/end', requireAuth, async (req: Request, res: Response) => {
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

  // Delete the LiveKit room (best-effort)
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
});

// GET /streams/venue/:venueId/recent — recent ended streams for a venue
router.get('/venue/:venueId/recent', async (req: Request, res: Response) => {
  const streams = await prisma.liveStream.findMany({
    where: { venueId: req.params.venueId, status: 'ENDED' },
    orderBy: { endedAt: 'desc' },
    take: 10,
    include: {
      venue: { select: { id: true, name: true, type: true, location: true } },
    },
  });

  res.json(streams);
});

export default router;
