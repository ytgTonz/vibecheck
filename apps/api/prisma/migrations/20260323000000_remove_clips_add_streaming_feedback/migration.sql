-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT IF EXISTS "Clip_venueId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Clip";

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'SUGGESTION', 'GENERAL');

-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('BAD', 'NEUTRAL', 'GOOD');

-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('IDLE', 'LIVE', 'ENDED');

-- AlterTable (add venue detail fields)
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "coverCharge" TEXT;
ALTER TABLE "Venue" ADD COLUMN IF NOT EXISTS "drinkPrices" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "rating" "FeedbackRating" NOT NULL,
    "message" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LiveStream" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "livekitRoom" TEXT NOT NULL,
    "status" "StreamStatus" NOT NULL DEFAULT 'IDLE',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "currentViewerCount" INTEGER NOT NULL DEFAULT 0,
    "viewerPeak" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LiveStream_livekitRoom_key" ON "LiveStream"("livekitRoom");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveStream_venueId_status_idx" ON "LiveStream"("venueId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LiveStream_status_idx" ON "LiveStream"("status");

-- AddForeignKey (Feedback)
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (LiveStream → Venue)
ALTER TABLE "LiveStream" ADD CONSTRAINT "LiveStream_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (LiveStream → User)
ALTER TABLE "LiveStream" ADD CONSTRAINT "LiveStream_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
