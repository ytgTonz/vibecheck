import prisma from './prisma';
import { sendNotification } from './notifications';

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
    } catch (err) {
      console.error('[ScheduledNotifications] poller error:', err);
    }
  }, 60_000);
}
