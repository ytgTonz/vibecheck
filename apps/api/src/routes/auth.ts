import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { sendNotification } from '../lib/notifications';
import { requireAuth } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

const SALT_ROUNDS = 10;

/** Build a JWT and user response object. */
function buildAuthResponse(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  phone?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}) {
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
      phone: user.phone ?? null,
      emailVerified: user.emailVerified ?? false,
      phoneVerified: user.phoneVerified ?? false,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { accountType, email, password, name } = req.body;

  // Common validation
  if (!accountType || !email || !password) {
    res.status(400).json({ error: 'accountType, email, and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  // Check email availability upfront for all account types
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // ─── Owner registration ──────────────────────────────────────────────
  if (accountType === 'owner') {
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

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
  if (accountType === 'promoter') {
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

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
    return;
  }

  // ─── Viewer registration ─────────────────────────────────────────────
  if (accountType === 'viewer') {
    const { displayName, phone } = req.body;

    if (!displayName || !phone) {
      res.status(400).json({ error: 'displayName and phone are required for viewer registration' });
      return;
    }

    const emailVerifyToken = randomUUID();
    // 6-digit OTP — stored as plaintext for stub; TODO: hash before v2
    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: displayName,
        role: 'VIEWER',
        phone,
        emailVerified: false,
        phoneVerified: false,
        emailVerifyToken,
        phoneOtp,
      },
    });

    const authResponse = buildAuthResponse(user);

    // Stub: return verification tokens in response body.
    // Remove otpDebug and verificationLinks when real providers are wired.
    res.status(201).json({
      ...authResponse,
      otpDebug: { phoneOtp },
      verificationLinks: { emailVerifyUrl: `/auth/verify-email?token=${emailVerifyToken}` },
    });
    return;
  }

  res.status(400).json({ error: 'accountType must be "owner", "promoter", or "viewer"' });
});

// GET /auth/verify-email?token=
router.get('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'token is required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  res.json({ message: 'Email verified', user: buildAuthResponse(updated).user });
});

// POST /auth/verify-phone
router.post('/verify-phone', requireAuth, async (req: Request, res: Response) => {
  const { otp } = req.body;

  if (!otp) {
    res.status(400).json({ error: 'otp is required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user || !user.phoneOtp) {
    res.status(400).json({ error: 'No pending phone verification' });
    return;
  }

  if (user.phoneOtp !== otp) {
    res.status(400).json({ error: 'Invalid OTP' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: true, phoneOtp: null },
  });

  // Return a refreshed user object so the client store can update verification state
  res.json({ message: 'Phone verified', user: buildAuthResponse(updated).user });
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
