import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const venues = [
  {
    name: 'Latitudes Bar & Grill',
    type: 'BAR' as const,
    location: 'Esplanade, Quigney',
    city: 'East London',
    hours: '11am–2am Mon–Sun',
    musicGenre: ['Afrobeats', 'R&B', 'Hip Hop'],
  },
  {
    name: 'The Berea Bar',
    type: 'BAR' as const,
    location: 'Berea Rd, Berea',
    city: 'East London',
    hours: '4pm–2am Tue–Sun',
    musicGenre: ['Afrobeats', 'Amapiano', 'R&B'],
  },
  {
    name: 'Club 263',
    type: 'NIGHTCLUB' as const,
    location: 'Oxford St, East London CBD',
    city: 'East London',
    hours: '10pm–4am Fri/Sat',
    musicGenre: ['Amapiano', 'Hip Hop', 'Afrobeats'],
  },
  {
    name: 'Sundowner Rooftop',
    type: 'ROOFTOP' as const,
    location: 'Esplanade, Quigney',
    city: 'East London',
    hours: '4pm–midnight Thu–Sun',
    musicGenre: ['Afrobeats', 'Soul', 'House'],
  },
  {
    name: 'Oasis Bar & Lounge',
    type: 'LOUNGE' as const,
    location: 'Phillip Frame Rd, Chiselhurst',
    city: 'East London',
    hours: '5pm–2am Wed–Sun',
    musicGenre: ['Amapiano', 'R&B', 'Afrobeats'],
  },
  {
    name: 'Ziyo Restaurant & Bar',
    type: 'RESTAURANT_BAR' as const,
    location: 'Bonza Bay Rd, Beacon Bay',
    city: 'East London',
    hours: '12pm–11pm Mon–Sun',
    musicGenre: ['Jazz', 'Soul', 'Afrobeats'],
  },
  {
    name: 'The Grind',
    type: 'BAR' as const,
    location: 'Vincent Park Shopping Centre, Vincent',
    city: 'East London',
    hours: '11am–2am Mon–Sun',
    musicGenre: ['Hip Hop', 'R&B', 'Amapiano'],
  },
  {
    name: 'Nxamalala Shisa Nyama',
    type: 'SHISA_NYAMA' as const,
    location: 'Mdantsane, Unit 7',
    city: 'East London',
    hours: '12pm–10pm Sat/Sun',
    musicGenre: ['Amapiano', 'Afrobeats', 'Kwaito'],
  },
  {
    name: 'The Boardwalk Lounge',
    type: 'LOUNGE' as const,
    location: 'Esplanade, Quigney Beach',
    city: 'East London',
    hours: '3pm–2am Thu–Sun',
    musicGenre: ['House', 'Afrobeats', 'R&B'],
  },
  {
    name: 'Rhythm City Club',
    type: 'NIGHTCLUB' as const,
    location: 'Fleet St, East London CBD',
    city: 'East London',
    hours: '9pm–5am Fri/Sat',
    musicGenre: ['Amapiano', 'Afrobeats', 'Dancehall'],
  },
];

async function main() {
  console.log('Seeding venues...');

  await prisma.venue.createMany({ data: venues });

  console.log(`✓ ${venues.length} venues seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
