import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { config } from '../config/env';
import { sendNotification } from '../lib/notifications';
import { validateBody, asyncHandler } from '../middleware/validate';

const router = Router();

const SALT_ROUNDS = 10;
const INVITE_EXPIRY_DAYS = 7;

const RegisterOwnerSchema = z.object({
  accountType: z.literal('owner'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  venue: z.object({
    name: z.string().min(1, 'Venue name is required'),
    type: z.string().min(1, 'Venue type is required'),
    location: z.string().min(1, 'Venue location is required'),
    hours: z.string().optional(),
    musicGenre: z.array(z.string()).optional(),
  }),
});

const RegisterPromoterSchema = z.object({
  accountType: z.literal('promoter'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  inviteCode: z.string().min(1, 'Invite code is required'),
});

const RegisterSchema = z.discriminatedUnion('accountType', [
  RegisterOwnerSchema,
  RegisterPromoterSchema,
]);

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** Build a JWT and user response object. */
function buildAuthResponse(user: { id: string; email: string; name: string; role: string; createdAt: Date }) {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.JWT_SECRET,
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
router.post('/register', validateBody(RegisterSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof RegisterSchema>;
  const { email, password, name } = body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // ─── Owner registration ──────────────────────────────────────────────
  if (body.accountType === 'owner') {
    const { venue } = body;

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
  const { inviteCode } = body;

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
}));

// POST /auth/login
router.post('/login', validateBody(LoginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body as z.infer<typeof LoginSchema>;

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
}));

export default router;
