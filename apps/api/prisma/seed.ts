import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

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

const seedOwners = venues.map((venue, index) => ({
  email: `owner${index + 1}@vibecheck.local`,
  name: `${venue.name} Owner`,
  role: 'VENUE_OWNER' as const,
}));

// Cloudinary sample video URLs
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
if (!CLOUD_NAME) {
  throw new Error('CLOUDINARY_CLOUD_NAME is not set in environment variables');
}
const sampleVideos = [
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/samples/sea-turtle.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/samples/sea-turtle.jpg`,
    duration: 30,
    caption: 'Friday night vibes',
  },
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/samples/elephants.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/samples/elephants.jpg`,
    duration: 25,
    caption: 'Weekend energy',
  },
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/samples/cld-sample-video.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/samples/cld-sample-video.jpg`,
    duration: 20,
    caption: 'Saturday crowd check',
  },
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1773819944/club-1_nidrc3.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/v1773819944/club-1_nidrc3.jpg`,
    duration: 15,
    caption: 'Dance floor heating up',
  },
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1773819966/club-2_zpvp9v.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/v1773819966/club-2_zpvp9v.jpg`,
    duration: 15,
    caption: 'Late night energy',
  },
  {
    videoUrl: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/v1773819975/club-3_grgo2d.mp4`,
    thumbnail: `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_1/v1773819975/club-3_grgo2d.jpg`,
    duration: 15,
    caption: 'Vibe check incoming',
  },
];

async function main() {
  // Clear existing data in foreign-key order.
  console.log('Clearing old data...');
  await prisma.clip.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.venuePromoter.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding venue owners...');

  const ownerPassword = await bcrypt.hash('seed-owner-password', SALT_ROUNDS);
  const createdOwners = await Promise.all(
    seedOwners.map((owner) =>
      prisma.user.create({
        data: {
          email: owner.email,
          name: owner.name,
          password: ownerPassword,
          role: owner.role,
        },
      })
    )
  );

  console.log(`✓ ${createdOwners.length} owners seeded`);

  console.log('Seeding venues...');

  const createdVenues = await Promise.all(
    venues.map((venue, index) =>
      prisma.venue.create({
        data: {
          ...venue,
          owner: { connect: { id: createdOwners[index]!.id } },
        },
      })
    )
  );

  console.log(`✓ ${createdVenues.length} venues seeded`);

  // Seed 3 sample clips for each venue
  console.log('Seeding clips...');

  let clipCount = 0;
  for (const venue of createdVenues) {
    for (const sample of sampleVideos) {
      await prisma.clip.create({
        data: {
          videoUrl: sample.videoUrl,
          thumbnail: sample.thumbnail,
          duration: sample.duration,
          venueId: venue.id,
          uploadedBy: 'seed-promoter',
          musicGenre: venue.musicGenre[0] ?? null,
          caption: sample.caption,
        },
      });
      clipCount++;
    }
  }

  console.log(`✓ ${clipCount} clips seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
