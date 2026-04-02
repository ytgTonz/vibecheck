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

  console.log('[Webhook]', event.event, 'room:', roomName);

  try {
    switch (event.event) {
      case 'room_started': {
        // Room created — stream stays IDLE until media is actually published.
        // The go-live endpoint or track_published webhook handles the transition.
        console.log('[Webhook] room_started — stream stays IDLE');
        break;
      }

      case 'track_published': {
        // Backup: if the broadcaster's client-side go-live call was missed,
        // transition IDLE → LIVE when the broadcaster publishes camera video.
        const pub = event.participant;
        const track = event.track;
        console.log('[Webhook] track_published participant:', pub?.identity, 'canPublish:', pub?.permission?.canPublish, 'trackSource:', track?.source);
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
          console.log('[Webhook] IDLE→LIVE transition triggered for room:', roomName);
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

        // Atomic increment + peak update in one query — avoids race conditions
        // when multiple viewers join simultaneously.
        const updated = await prisma.$queryRaw<{ id: string; venueId: string; currentViewerCount: number }[]>`
          UPDATE "LiveStream"
          SET "currentViewerCount" = "currentViewerCount" + 1,
              "viewerPeak" = GREATEST("viewerPeak", "currentViewerCount" + 1)
          WHERE "livekitRoom" = ${roomName}
            AND status != 'ENDED'
          RETURNING id, "venueId", "currentViewerCount"
        `;

        if (updated.length > 0) {
          const { id, venueId, currentViewerCount } = updated[0];
          emitViewerUpdate({ venueId, streamId: id, currentViewerCount });
        }
        break;
      }

      case 'participant_left': {
        const participant = event.participant;
        if (participant?.permission?.canPublish) break;

        // Atomic decrement — floor at 0, viewerPeak unchanged.
        const updated = await prisma.$queryRaw<{ id: string; venueId: string; currentViewerCount: number }[]>`
          UPDATE "LiveStream"
          SET "currentViewerCount" = GREATEST("currentViewerCount" - 1, 0)
          WHERE "livekitRoom" = ${roomName}
            AND status != 'ENDED'
          RETURNING id, "venueId", "currentViewerCount"
        `;

        if (updated.length > 0) {
          const { id, venueId, currentViewerCount } = updated[0];
          emitViewerUpdate({ venueId, streamId: id, currentViewerCount });
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
