import cloudinary from './cloudinary';
import prisma from './prisma';

/**
 * Extract Cloudinary public IDs from clip videoUrls.
 * Pure function — no side effects.
 */
export function extractClipPublicIds(clips: { videoUrl: string }[]): string[] {
  const ids: string[] = [];
  for (const clip of clips) {
    const match = clip.videoUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
    const publicId = match?.[1];
    if (publicId?.startsWith('vibecheck/clips/')) {
      ids.push(publicId);
    }
  }
  return ids;
}

/**
 * Best-effort Cloudinary asset cleanup.
 * Call AFTER the DB transaction commits. Logs failures but never throws.
 */
export async function cleanupCloudinaryAssets(publicIds: string[]): Promise<void> {
  for (const id of publicIds) {
    try {
      await cloudinary.uploader.destroy(id, { resource_type: 'video' });
    } catch (err) {
      console.warn(`Cloudinary cleanup failed for ${id}:`, err);
    }
  }
}

/**
 * Delete a venue and all its related records (clips, invites, promoters).
 * DB operations are transactional; Cloudinary cleanup is best-effort after commit.
 */
export async function deleteVenueWithCascade(venueId: string): Promise<void> {
  // Fetch clip public IDs before transaction
  const clips = await prisma.clip.findMany({
    where: { venueId },
    select: { videoUrl: true },
  });
  const publicIds = extractClipPublicIds(clips);

  // Transactional DB cleanup
  await prisma.$transaction(async (tx) => {
    await tx.clip.deleteMany({ where: { venueId } });
    await tx.invite.deleteMany({ where: { venueId } });
    await tx.venuePromoter.deleteMany({ where: { venueId } });
    await tx.venue.delete({ where: { id: venueId } });
  });

  // Best-effort Cloudinary cleanup after commit
  await cleanupCloudinaryAssets(publicIds);
}

/**
 * Delete a user and all their owned/linked resources.
 * Rejects self-delete and deleting ADMIN users.
 */
export async function deleteUserWithCascade(
  userId: string,
  requestingUserId: string
): Promise<void> {
  // Block self-delete
  if (userId === requestingUserId) {
    throw new AdminDeleteError('Cannot delete your own account', 400);
  }

  // Fetch target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!targetUser) {
    throw new AdminDeleteError('User not found', 404);
  }

  // Block deleting ADMIN users
  if (targetUser.role === 'ADMIN') {
    throw new AdminDeleteError('Cannot delete an admin user', 403);
  }

  // Gather data for cleanup
  const ownedVenues = await prisma.venue.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const ownedVenueIds = ownedVenues.map((v) => v.id);

  // Collect all clip public IDs (user's clips + owned venues' clips)
  const userClips = await prisma.clip.findMany({
    where: { uploadedBy: userId },
    select: { videoUrl: true },
  });
  const venueClips = ownedVenueIds.length > 0
    ? await prisma.clip.findMany({
        where: { venueId: { in: ownedVenueIds } },
        select: { videoUrl: true },
      })
    : [];
  const allClips = [...userClips, ...venueClips];
  // Deduplicate by videoUrl
  const uniqueClips = [...new Map(allClips.map((c) => [c.videoUrl, c])).values()];
  const publicIds = extractClipPublicIds(uniqueClips);

  // Transactional DB cleanup
  await prisma.$transaction(async (tx) => {
    // Delete feedback
    await tx.feedback.deleteMany({ where: { userId } });

    // Delete venue links (promoter associations)
    await tx.venuePromoter.deleteMany({ where: { userId } });

    // Delete clips uploaded by user
    await tx.clip.deleteMany({ where: { uploadedBy: userId } });

    // For each owned venue: delete clips, invites, promoters, then venue
    for (const venueId of ownedVenueIds) {
      await tx.clip.deleteMany({ where: { venueId } });
      await tx.invite.deleteMany({ where: { venueId } });
      await tx.venuePromoter.deleteMany({ where: { venueId } });
      await tx.venue.delete({ where: { id: venueId } });
    }

    // Delete invites created by user (not already removed through owned venues)
    await tx.invite.deleteMany({ where: { createdBy: userId } });

    // Delete the user
    await tx.user.delete({ where: { id: userId } });
  });

  // Best-effort Cloudinary cleanup after commit
  await cleanupCloudinaryAssets(publicIds);
}

/**
 * Delete a single clip with Cloudinary cleanup.
 */
export async function deleteClipWithCleanup(clipId: string): Promise<void> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    select: { videoUrl: true },
  });

  if (!clip) {
    throw new AdminDeleteError('Clip not found', 404);
  }

  const publicIds = extractClipPublicIds([clip]);

  await prisma.clip.delete({ where: { id: clipId } });

  await cleanupCloudinaryAssets(publicIds);
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
