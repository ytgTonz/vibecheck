import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { isVenueMember } from '../lib/venueAuth';

const router = Router();

// ─── POST /visits/intent ──────────────────────────────────────────────────────
// Record "I'm Coming" for a venue visit. Idempotent per session. Viewer-only.
router.post('/intent', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'VIEWER') {
    res.status(403).json({ error: 'Only viewer accounts can record visit intent' });
    return;
  }
  const { venueId, streamId } = req.body;
  const userId = req.user!.userId;

  if (!venueId) {
    res.status(400).json({ error: 'venueId is required' });
    return;
  }

  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Use findFirst — @@unique with nullable streamId is not enforced by Postgres for null values
  const existing = await prisma.venueVisit.findFirst({
    where: { userId, venueId, streamId: streamId ?? null },
  });

  if (existing) {
    res.json({ visitId: existing.id, intentAt: existing.intentAt?.toISOString() ?? null, alreadyRecorded: true });
    return;
  }

  const visit = await prisma.venueVisit.create({
    data: { userId, venueId, streamId: streamId ?? null, intentAt: new Date() },
  });

  res.status(201).json({ visitId: visit.id, intentAt: visit.intentAt!.toISOString(), alreadyRecorded: false });
});

// ─── POST /visits/arrival ─────────────────────────────────────────────────────
// Generate a QR token for arrival. Requires prior intent and full verification. Viewer-only.
router.post('/arrival', requireAuth, async (req: Request, res: Response) => {
  if (req.user!.role !== 'VIEWER') {
    res.status(403).json({ error: 'Only viewer accounts can record arrival' });
    return;
  }
  const { venueId, streamId } = req.body;
  const userId = req.user!.userId;

  if (!venueId) {
    res.status(400).json({ error: 'venueId is required' });
    return;
  }

  // Both email and phone must be verified
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, phoneVerified: true },
  });

  if (!user?.emailVerified || !user?.phoneVerified) {
    res.status(403).json({ error: 'Both email and phone must be verified before checking in' });
    return;
  }

  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Find existing visit for this session
  const visit = await prisma.venueVisit.findFirst({
    where: { userId, venueId, streamId: streamId ?? null },
    include: { qrToken: true },
  });

  if (!visit || !visit.intentAt) {
    res.status(409).json({ error: 'Must register intent ("I\'m Coming") before checking in' });
    return;
  }

  // Idempotent — return existing QR token if already generated
  if (visit.arrivedAt && visit.qrToken) {
    const incentive = visit.qrToken.incentiveId
      ? await prisma.venueIncentive.findUnique({
          where: { id: visit.qrToken.incentiveId },
          select: { title: true, description: true },
        })
      : null;

    res.json({
      visitId: visit.id,
      qrToken: visit.qrToken.token,
      expiresAt: visit.qrToken.expiresAt.toISOString(),
      incentive,
    });
    return;
  }

  // Fetch active incentive (QR generates regardless of whether one exists)
  const incentive = await prisma.venueIncentive.findFirst({
    where: { venueId, active: true },
    select: { id: true, title: true, description: true, expiresAt: true },
  });

  const t24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const expiresAt = incentive?.expiresAt
    ? new Date(Math.min(incentive.expiresAt.getTime(), t24h.getTime()))
    : t24h;

  const token = randomUUID();

  try {
    await prisma.$transaction([
      prisma.venueVisit.update({
        where: { id: visit.id },
        data: { arrivedAt: new Date(), incentiveId: incentive?.id ?? null },
      }),
      prisma.attendanceQRToken.create({
        data: {
          token,
          userId,
          venueId,
          visitId: visit.id,
          incentiveId: incentive?.id ?? null,
          expiresAt,
        },
      }),
    ]);
  } catch (err: unknown) {
    // P2002 = unique constraint violation: a concurrent request already created the QR token.
    // Recover by re-fetching the now-existing token and returning it (idempotent).
    const isPrismaUniqueViolation =
      typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
    if (!isPrismaUniqueViolation) throw err;

    const existing = await prisma.attendanceQRToken.findUnique({
      where: { visitId: visit.id },
      include: { incentive: { select: { title: true, description: true } } },
    });
    if (!existing) throw err; // should never happen

    res.json({
      visitId: visit.id,
      qrToken: existing.token,
      expiresAt: existing.expiresAt.toISOString(),
      incentive: existing.incentive ?? null,
    });
    return;
  }

  res.status(201).json({
    visitId: visit.id,
    qrToken: token,
    expiresAt: expiresAt.toISOString(),
    incentive: incentive ? { title: incentive.title, description: incentive.description } : null,
  });
});

// ─── GET /visits/qr/:token ────────────────────────────────────────────────────
// Preview a QR token. Public — returns minimal data, no user identity.
router.get('/qr/:token', async (req: Request, res: Response) => {
  const qr = await prisma.attendanceQRToken.findUnique({
    where: { token: req.params.token },
    include: {
      venue: { select: { name: true } },
      incentive: { select: { title: true, description: true } },
    },
  });

  if (!qr) {
    res.status(404).json({ error: 'QR token not found' });
    return;
  }

  if (qr.usedAt) {
    res.status(410).json({ valid: false, reason: 'already_used', claimedAt: qr.usedAt.toISOString() });
    return;
  }

  if (qr.expiresAt < new Date()) {
    res.status(410).json({ valid: false, reason: 'expired' });
    return;
  }

  res.json({
    valid: true,
    venueId: qr.venueId,
    venueName: qr.venue.name,
    expiresAt: qr.expiresAt.toISOString(),
    used: false,
    incentive: qr.incentive ?? null,
  });
});

// ─── POST /visits/qr/:token/redeem ───────────────────────────────────────────
// Redeem a QR token. Staff/owner only. Single-use, atomic.
router.post('/qr/:token/redeem', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const qr = await prisma.attendanceQRToken.findUnique({
    where: { token: req.params.token },
    include: {
      incentive: { select: { title: true, description: true } },
    },
  });

  if (!qr) {
    res.status(404).json({ error: 'QR token not found' });
    return;
  }

  if (qr.usedAt) {
    res.status(410).json({ error: 'QR already used', claimedAt: qr.usedAt.toISOString() });
    return;
  }

  if (qr.expiresAt < new Date()) {
    res.status(410).json({ error: 'QR expired' });
    return;
  }

  // Verify redeemer is a venue member (owner, promoter, or admin)
  const authorized = await isVenueMember(userId, qr.venueId, userRole);
  if (!authorized) {
    res.status(403).json({ error: 'Not authorized to redeem for this venue' });
    return;
  }

  const now = new Date();
  // Conditional atomic write: only updates if usedAt is still null.
  // If two redeems race, exactly one will update count=1; the other gets count=0 → 410.
  const { count } = await prisma.attendanceQRToken.updateMany({
    where: { token: req.params.token, usedAt: null },
    data: { usedAt: now },
  });

  if (count === 0) {
    // Another concurrent request won the race — fetch the real claimedAt to return
    const claimed = await prisma.attendanceQRToken.findUnique({
      where: { token: req.params.token },
      select: { usedAt: true },
    });
    res.status(410).json({ error: 'QR already used', claimedAt: claimed?.usedAt?.toISOString() ?? now.toISOString() });
    return;
  }

  res.json({
    message: 'Redeemed',
    incentive: qr.incentive ?? null,
    claimedAt: now.toISOString(),
  });
});

export default router;
