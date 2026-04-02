import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import prisma from './prisma';
import { getIO } from './socket';

export const expo = new Expo();

/** In-memory queue of receipt IDs → token, awaiting Expo receipt check. */
export const receiptQueue: Array<{ receiptId: string; token: string }> = [];

export interface SendNotificationOptions {
  type: 'STREAM_LIVE' | 'STREAM_ENDED' | 'VENUE_CREATED' | 'USER_REGISTERED' | 'ATTENDANCE_INTENT';
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Send to a specific user (e.g. venue owner). */
  targetUserId?: string;
  /** Send to all users with this role (e.g. 'ADMIN'). */
  targetRole?: string;
}

/**
 * Central notification dispatcher.
 * 1. Persists Notification record(s) in the database.
 * 2. Sends Expo push notifications to registered mobile devices.
 * 3. Emits a Socket.IO event for web clients.
 */
export async function sendNotification(opts: SendNotificationOptions) {
  const { type, title, body, data, targetUserId, targetRole } = opts;

  try {
    // 1. Persist notification(s)
    if (targetUserId) {
      await prisma.notification.create({
        data: { type, title, body, data: data ?? undefined, userId: targetUserId },
      });
    } else if (targetRole) {
      const users = await prisma.user.findMany({
        where: { role: targetRole as never },
        select: { id: true },
      });
      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            type,
            title,
            body,
            data: data ?? undefined,
            userId: u.id,
          })),
        });
      }
    } else {
      // Broadcast — store with null userId
      await prisma.notification.create({
        data: { type, title, body, data: data ?? undefined, userId: null },
      });
    }

    // 2. Send Expo push notifications
    await sendPushNotifications({ type, title, body, data, targetUserId, targetRole });

    // 3. Emit Socket.IO event
    const io = getIO();
    const payload = { type, title, body, data };

    if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('notification', payload);
    } else if (targetRole) {
      io.to(`role:${targetRole}`).emit('notification', payload);
    } else {
      io.emit('notification', payload);
    }
  } catch (err) {
    // Notification failures should never break the main request
    console.error('[Notifications] failed to send:', err);
  }
}

async function sendPushNotifications(opts: SendNotificationOptions) {
  const { title, body, data, targetUserId, targetRole } = opts;

  // Find matching push tokens
  const where: Record<string, unknown> = {};
  if (targetUserId) {
    where.userId = targetUserId;
  } else if (targetRole) {
    where.user = { role: targetRole };
  }
  // If neither is set, send to ALL registered tokens (broadcast)

  const tokens = await prisma.pushToken.findMany({
    where,
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      title,
      body,
      data: data as Record<string, unknown> | undefined,
      sound: 'default' as const,
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'ok') {
          receiptQueue.push({ receiptId: ticket.id, token: chunk[i]!.to as string });
        }
      });
    } catch (err) {
      console.error('[Notifications] Expo push error:', err);
    }
  }
}
