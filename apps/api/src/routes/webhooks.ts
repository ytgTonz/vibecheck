import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { webhookReceiver } from '../lib/livekit';
import { authorizeHeader, TrackSource } from 'livekit-server-sdk';
import { emitStreamLive, emitStreamEnded, emitViewerUpdate } from '../lib/socket';
import { sendNotification } from '../lib/notifications';

const router = Router();

// POST /webhooks/livekit — LiveKit webhook handler
// Body must be raw (registered before express.json() in index.ts)
router.post('/livekit', async (req: Request, res: Response) => {
  const authHeader = req.get(authorizeHeader) || req.get('Authorization') || '';
  const rawBody = (req.body as Buffer).toString('utf-8');

  let event;
  try {
    event = await webhookReceiver.receive(rawBody, authHeader);
  } catch {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  const roomName = event.room?.name;
  if (!roomName) {
    res.status(200).send('ok');
    return;
  }

  try {
    switch (event.event) {
      case 'room_started': {
        // Room created — stream stays IDLE until media is actually published.
        // The go-live endpoint or track_published webhook handles the transition.
        break;
      }

      case 'track_published': {
        // Backup: if the broadcaster's client-side go-live call was missed,
        // transition IDLE → LIVE when the broadcaster publishes camera video.
        const pub = event.participant;
        const track = event.track;
        if (
          pub?.permission?.canPublish &&
          track?.source === TrackSource.CAMERA
        ) {
          const transitioned = await prisma.liveStream.findFirst({
            where: { livekitRoom: roomName, status: 'IDLE' },
            include: { venue: { select: { name: true, ownerId: true } } },
          });
          await prisma.liveStream.updateMany({
            where: { livekitRoom: roomName, status: 'IDLE' },
            data: { status: 'LIVE', startedAt: new Date() },
          });
          if (transitioned) {
            emitStreamLive({ venueId: transitioned.venueId, streamId: transitioned.id });
            sendNotification({
              type: 'STREAM_LIVE',
              title: `${transitioned.venue.name} just went live`,
              body: 'Tune in now to see the vibe!',
              data: { venueId: transitioned.venueId, streamId: transitioned.id },
            });
          }
        }
        break;
      }

      case 'room_finished': {
        const ending = await prisma.liveStream.findMany({
          where: { livekitRoom: roomName, status: { not: 'ENDED' } },
        });
        await prisma.liveStream.updateMany({
          where: { livekitRoom: roomName, status: { not: 'ENDED' } },
          data: { status: 'ENDED', endedAt: new Date() },
        });
        for (const s of ending) {
          emitStreamEnded({ venueId: s.venueId, streamId: s.id });
        }
        break;
      }

      case 'participant_joined': {
        // Skip broadcaster (they have canPublish)
        const participant = event.participant;
        if (participant?.permission?.canPublish) break;

        const stream = await prisma.liveStream.findUnique({
          where: { livekitRoom: roomName },
        });

        if (stream && stream.status !== 'ENDED') {
          const newCount = stream.currentViewerCount + 1;
          await prisma.liveStream.update({
            where: { id: stream.id },
            data: {
              currentViewerCount: newCount,
              viewerPeak: Math.max(stream.viewerPeak, newCount),
            },
          });
          emitViewerUpdate({ venueId: stream.venueId, streamId: stream.id, currentViewerCount: newCount });
        }
        break;
      }

      case 'participant_left': {
        const participant = event.participant;
        if (participant?.permission?.canPublish) break;

        const stream = await prisma.liveStream.findUnique({
          where: { livekitRoom: roomName },
        });

        if (stream && stream.status !== 'ENDED') {
          const newCount = Math.max(0, stream.currentViewerCount - 1);
          await prisma.liveStream.update({
            where: { id: stream.id },
            data: { currentViewerCount: newCount },
          });
          emitViewerUpdate({ venueId: stream.venueId, streamId: stream.id, currentViewerCount: newCount });
        }
        break;
      }
    }
  } catch {
    // webhook processing errors are non-fatal — always respond 200
  }

  res.status(200).send('ok');
});

export default router;
