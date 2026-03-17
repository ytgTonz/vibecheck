import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const venues = [
  {
    name: 'Fabric',
    type: 'NIGHTCLUB' as const,
    location: 'Charterhouse St, Farringdon',
    city: 'East London',
    hours: '11pm–8am Fri/Sat',
    musicGenre: ['Techno', 'Drum & Bass', 'House'],
  },
  {
    name: 'Egg London',
    type: 'NIGHTCLUB' as const,
    location: 'York Way, Kings Cross',
    city: 'East London',
    hours: '10pm–6am Fri/Sat',
    musicGenre: ['House', 'Techno'],
  },
  {
    name: 'Colour Factory',
    type: 'NIGHTCLUB' as const,
    location: 'White Post Lane, Hackney Wick',
    city: 'East London',
    hours: '10pm–6am Fri/Sat',
    musicGenre: ['House', 'Electronic', 'Afrobeats'],
  },
  {
    name: 'Fold',
    type: 'NIGHTCLUB' as const,
    location: 'Channelsea Rd, Stratford',
    city: 'East London',
    hours: '11pm–10am Fri/Sat',
    musicGenre: ['Techno', 'Hard Techno'],
  },
  {
    name: 'EartH',
    type: 'NIGHTCLUB' as const,
    location: 'Stoke Newington Rd, Hackney',
    city: 'East London',
    hours: '9pm–4am',
    musicGenre: ['Electronic', 'Indie', 'Afrobeats'],
  },
  {
    name: 'Boxpark Shoreditch',
    type: 'BAR' as const,
    location: '2-10 Bethnal Green Rd, Shoreditch',
    city: 'East London',
    hours: '11am–11pm Mon–Sun',
    musicGenre: ['Afrobeats', 'Hip Hop', 'R&B'],
  },
  {
    name: 'The Laundry',
    type: 'BAR' as const,
    location: 'Chippendale St, Hackney',
    city: 'East London',
    hours: '5pm–2am Thu–Sat',
    musicGenre: ['House', 'Disco'],
  },
  {
    name: 'Netil360',
    type: 'ROOFTOP' as const,
    location: 'Netil House, 1 Westgate St, Hackney',
    city: 'East London',
    hours: '5pm–midnight Thu–Sat',
    musicGenre: ['House', 'Electronic', 'Afrobeats'],
  },
  {
    name: 'Oslo Hackney',
    type: 'BAR' as const,
    location: 'Amhurst Rd, Hackney Central',
    city: 'East London',
    hours: '5pm–3am Wed–Sat',
    musicGenre: ['Drum & Bass', 'Grime', 'R&B'],
  },
  {
    name: 'Grow Hackney',
    type: 'BAR' as const,
    location: 'Unit 1, 49 Helmsley Place, London Fields',
    city: 'East London',
    hours: '12pm–midnight',
    musicGenre: ['Reggae', 'Soul', 'Afrobeats'],
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
