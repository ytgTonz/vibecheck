import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

async function main() {
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password && process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SEED_PASSWORD is required in production');
  }

  const email = 'admin@vibecheck.local';

  // Upsert so the script is idempotent
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists (${email}), skipping.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(
    password || 'admin-dev-password',
    SALT_ROUNDS
  );

  const admin = await prisma.user.create({
    data: {
      email,
      name: 'Platform Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`✓ Admin user seeded (${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
