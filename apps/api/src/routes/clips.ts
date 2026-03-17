import { Router, Request, Response } from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../lib/cloudinary';
import prisma from '../lib/prisma';

const router = Router();

// multer configured to hold the file in memory (not saved to disk)
const upload = multer({ storage: multer.memoryStorage() });

// POST /clips — upload a video clip and save it to the database
router.post('/', upload.single('video'),
 async (req: Request, res: Response) => {
  const { venueId, uploadedBy, musicGenre, caption } = req.body;

  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  if (!venueId || !uploadedBy) {
    res.status(400).json({ error: 'venueId and uploadedBy are required' });
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
      uploadedBy,
      musicGenre: musicGenre ?? null,
      caption: caption ?? null,
    },
  });

  res.status(201).json(clip);
});

export default router;
