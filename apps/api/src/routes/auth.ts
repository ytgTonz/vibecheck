import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { sendNotification } from '../lib/notifications';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

const SALT_ROUNDS = 10;
const INVITE_EXPIRY_DAYS = 7;

/** Build a JWT and user response object. */
function buildAuthResponse(user: { id: string; email: string; name: string; role: string; createdAt: Date }) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { accountType, email, password, name } = req.body;

  // Common validation
  if (!accountType || !email || !password || !name) {
    res.status(400).json({ error: 'accountType, email, password, and name are required' });
    return;
  }

  if (accountType !== 'owner' && accountType !== 'promoter') {
    res.status(400).json({ error: 'accountType must be "owner" or "promoter"' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  // Check if email already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // ─── Owner registration ──────────────────────────────────────────────
  if (accountType === 'owner') {
    const { venue } = req.body;

    if (!venue?.name || !venue?.type || !venue?.location) {
      res.status(400).json({ error: 'Venue name, type, and location are required' });
      return;
    }

    const [user] = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'VENUE_OWNER',
        },
      });

      await tx.venue.create({
        data: {
          name: venue.name,
          type: venue.type,
          location: venue.location,
          hours: venue.hours ?? null,
          musicGenre: venue.musicGenre ?? [],
          ownerId: user.id,
        },
      });

      return [user];
    });

    sendNotification({
      type: 'USER_REGISTERED',
      title: `New user: ${user.name}`,
      body: `Registered as venue owner`,
      data: { userId: user.id },
      targetRole: 'ADMIN',
    });
    res.status(201).json(buildAuthResponse(user));
    return;
  }

  // ─── Promoter registration (with invite code) ────────────────────────
  const { inviteCode } = req.body;

  if (!inviteCode) {
    res.status(400).json({ error: 'Invite code is required for promoter registration' });
    return;
  }

  const invite = await prisma.invite.findUnique({
    where: { code: inviteCode.toUpperCase() },
  });

  if (!invite) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }

  if (invite.used) {
    res.status(410).json({ error: 'This invite code has already been used' });
    return;
  }

  if (invite.expiresAt < new Date()) {
    res.status(410).json({ error: 'This invite code has expired' });
    return;
  }

  const [user] = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'VENUE_PROMOTER',
      },
    });

    await tx.venuePromoter.create({
      data: {
        userId: user.id,
        venueId: invite.venueId,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: {
        used: true,
        usedBy: user.id,
        usedAt: new Date(),
      },
    });

    return [user];
  });

  sendNotification({
    type: 'USER_REGISTERED',
    title: `New user: ${user.name}`,
    body: `Registered as venue promoter`,
    data: { userId: user.id },
    targetRole: 'ADMIN',
  });
  res.status(201).json(buildAuthResponse(user));
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  res.json(buildAuthResponse(user));
});

export default router;
