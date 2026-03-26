-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('INTENT', 'ARRIVAL');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ATTENDANCE_INTENT';

-- CreateTable
CREATE TABLE "StreamAttendance" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "AttendanceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreamAttendance_streamId_type_idx" ON "StreamAttendance"("streamId", "type");

-- CreateIndex
CREATE INDEX "StreamAttendance_venueId_createdAt_idx" ON "StreamAttendance"("venueId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StreamAttendance_deviceId_streamId_type_key" ON "StreamAttendance"("deviceId", "streamId", "type");

-- CreateIndex
CREATE INDEX "ScheduledNotification_sent_scheduledFor_idx" ON "ScheduledNotification"("sent", "scheduledFor");

-- AddForeignKey
ALTER TABLE "StreamAttendance" ADD CONSTRAINT "StreamAttendance_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
