import prisma from './prisma';

/**
 * Check whether a user is authorized to act on a venue.
 * Returns true if the user is the venue owner or a linked promoter.
 */
export async function isVenueMember(
  userId: string,
  venueId: string
): Promise<boolean> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { ownerId: true },
  });

  if (!venue) return false;

  // Owner check
  if (venue.ownerId === userId) return true;

  // Promoter check
  const link = await prisma.venuePromoter.findUnique({
    where: { userId_venueId: { userId, venueId } },
  });

  return !!link;
}

/**
 * Check whether a user is the owner of a venue.
 */
export async function isVenueOwner(
  userId: string,
  venueId: string
): Promise<boolean> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { ownerId: true },
  });

  return venue?.ownerId === userId;
}
