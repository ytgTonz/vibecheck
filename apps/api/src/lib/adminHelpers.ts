import prisma from './prisma';

/**
 * Delete a venue and all its related records (invites, promoters, streams).
 */
export async function deleteVenueWithCascade(venueId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.liveStream.deleteMany({ where: { venueId } });
    await tx.invite.deleteMany({ where: { venueId } });
    await tx.venuePromoter.deleteMany({ where: { venueId } });
    await tx.venue.delete({ where: { id: venueId } });
  });
}

/**
 * Delete a user and all their owned/linked resources.
 * Rejects self-delete and deleting ADMIN users.
 */
export async function deleteUserWithCascade(
  userId: string,
  requestingUserId: string
): Promise<void> {
  if (userId === requestingUserId) {
    throw new AdminDeleteError('Cannot delete your own account', 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!targetUser) {
    throw new AdminDeleteError('User not found', 404);
  }

  if (targetUser.role === 'ADMIN') {
    throw new AdminDeleteError('Cannot delete an admin user', 403);
  }

  const ownedVenues = await prisma.venue.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const ownedVenueIds = ownedVenues.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    await tx.feedback.deleteMany({ where: { userId } });
    await tx.venuePromoter.deleteMany({ where: { userId } });

    for (const venueId of ownedVenueIds) {
      await tx.liveStream.deleteMany({ where: { venueId } });
      await tx.invite.deleteMany({ where: { venueId } });
      await tx.venuePromoter.deleteMany({ where: { venueId } });
      await tx.venue.delete({ where: { id: venueId } });
    }

    await tx.invite.deleteMany({ where: { createdBy: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}

/**
 * Custom error class for delete operations with HTTP status codes.
 */
export class AdminDeleteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminDeleteError';
    this.status = status;
  }
}
