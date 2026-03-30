import Expo from 'expo-server-sdk';
import prisma from './prisma';
import { sendNotification, receiptQueue } from './notifications';

const expo = new Expo();

/** Poll Expo push receipts and prune DeviceNotRegistered tokens. */
export function startReceiptPoller() {
  // Expo recommends waiting at least 15 minutes before checking receipts.
  setInterval(async () => {
    if (receiptQueue.length === 0) return;

    // Drain up to 300 entries per run
    const batch = receiptQueue.splice(0, 300);
    const idToToken = new Map(batch.map(({ receiptId, token }) => [receiptId, token]));

    try {
      const receiptChunks = expo.chunkPushNotificationReceiptIds([...idToToken.keys()]);
      for (const chunk of receiptChunks) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        const deadTokens: string[] = [];

        for (const [receiptId, receipt] of Object.entries(receipts)) {
          if (
            receipt.status === 'error' &&
            receipt.details?.error === 'DeviceNotRegistered'
          ) {
            const token = idToToken.get(receiptId);
            if (token) deadTokens.push(token);
          }
        }

        if (deadTokens.length > 0) {
          await prisma.pushToken.deleteMany({ where: { token: { in: deadTokens } } });
        }
      }
    } catch {
      // poller errors are non-fatal
    }
  }, 15 * 60 * 1000);
}

export function startNotificationPoller() {
  setInterval(async () => {
    try {
      const due = await prisma.scheduledNotification.findMany({
        where: { sent: false, scheduledFor: { lte: new Date() } },
        take: 50,
      });

      for (const scheduled of due) {
        // Mark sent before the Expo call to prevent double-send on slow responses
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: { sent: true },
        });

        await sendNotification({
          type: 'ATTENDANCE_INTENT',
          title: scheduled.title,
          body: scheduled.body,
          data: scheduled.data as Record<string, string> | undefined,
          targetUserId: scheduled.targetUserId ?? undefined,
        });
      }
    } catch {
      // poller errors are non-fatal
    }
  }, 60_000);
}
