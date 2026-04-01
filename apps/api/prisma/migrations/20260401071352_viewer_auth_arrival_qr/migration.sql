/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phoneOtp" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VenueIncentive" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueIncentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "streamId" TEXT,
    "intentAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "incentiveId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceQRToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "incentiveId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceQRToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VenueIncentive_venueId_active_idx" ON "VenueIncentive"("venueId", "active");

-- CreateIndex
CREATE INDEX "VenueVisit_venueId_idx" ON "VenueVisit"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueVisit_userId_venueId_streamId_key" ON "VenueVisit"("userId", "venueId", "streamId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceQRToken_token_key" ON "AttendanceQRToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceQRToken_visitId_key" ON "AttendanceQRToken"("visitId");

-- CreateIndex
CREATE INDEX "AttendanceQRToken_venueId_usedAt_idx" ON "AttendanceQRToken"("venueId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

-- AddForeignKey
ALTER TABLE "VenueIncentive" ADD CONSTRAINT "VenueIncentive_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueVisit" ADD CONSTRAINT "VenueVisit_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "VenueIncentive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceQRToken" ADD CONSTRAINT "AttendanceQRToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceQRToken" ADD CONSTRAINT "AttendanceQRToken_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceQRToken" ADD CONSTRAINT "AttendanceQRToken_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "VenueVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceQRToken" ADD CONSTRAINT "AttendanceQRToken_incentiveId_fkey" FOREIGN KEY ("incentiveId") REFERENCES "VenueIncentive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
