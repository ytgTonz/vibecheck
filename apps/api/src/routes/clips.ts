import { Router, Request, Response } from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../lib/cloudinary';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// multer configured to hold the file in memory (not saved to disk)
const upload = multer({ storage: multer.memoryStorage() });

// POST /clips — upload a video clip and save it to the database (auth required)
router.post('/', requireAuth, upload.single('video'),
 async (req: Request, res: Response) => {
  const { venueId, musicGenre, caption } = req.body;

  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  if (!venueId) {
    res.status(400).json({ error: 'venueId is required' });
    return;
  }

  // Check the venue exists before uploading
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) {
    res.status(404).json({ error: 'Venue not found' });
    return;
  }

  // Upload the video to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string; duration: number; thumbnail_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'vibecheck/clips',
        eager: [{ format: 'jpg', transformation: [{ start_offset: '1' }] }], // generate a thumbnail
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          secure_url: result.secure_url,
          duration: Math.round(result.duration ?? 0),
          thumbnail_url: result.eager?.[0]?.secure_url ?? '',
        });
      }
    );
    streamifier.createReadStream(req.file!.buffer).pipe(stream);
  });

  // Save the clip record to the database
  const clip = await prisma.clip.create({
    data: {
      videoUrl: uploadResult.secure_url,
      thumbnail: uploadResult.thumbnail_url,
      duration: uploadResult.duration,
      venueId,
      uploadedBy: req.user!.userId,
      musicGenre: musicGenre ?? null,
      caption: caption ?? null,
    },
  });

  res.status(201).json(clip);
});

// POST /clips/:id/view — increment the view count for a clip (public, no auth)
router.post('/:id/view', async (req: Request, res: Response) => {
  const { id } = req.params;

  const clip = await prisma.clip.findUnique({ where: { id } });
  if (!clip) {
    res.status(404).json({ error: 'Clip not found' });
    return;
  }

  const updated = await prisma.clip.update({
    where: { id },
    data: { views: { increment: 1 } },
    select: { id: true, views: true },
  });

  res.json(updated);
});

export default router;
