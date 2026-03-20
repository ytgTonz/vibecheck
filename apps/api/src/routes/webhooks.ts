import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { webhookReceiver } from '../lib/livekit';
import { authorizeHeader } from 'livekit-server-sdk';

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
        await prisma.liveStream.updateMany({
          where: { livekitRoom: roomName, status: { not: 'ENDED' } },
          data: { status: 'LIVE', startedAt: new Date() },
        });
        break;
      }

      case 'room_finished': {
        await prisma.liveStream.updateMany({
          where: { livekitRoom: roomName, status: { not: 'ENDED' } },
          data: { status: 'ENDED', endedAt: new Date() },
        });
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
          await prisma.liveStream.update({
            where: { id: stream.id },
            data: {
              currentViewerCount: Math.max(0, stream.currentViewerCount - 1),
            },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.status(200).send('ok');
});

export default router;
