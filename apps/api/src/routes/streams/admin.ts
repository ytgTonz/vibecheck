import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { requireAuth, requireRole } from '../../middleware/auth';
import { roomService } from '../../lib/livekit';

const router = Router();

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

export default router;
