import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore, registerPushToken, unregisterPushToken } from '@vibecheck/shared';

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // Native module unavailable (Expo Go) — push notifications disabled.
  if (__DEV__) console.log('[Notifications] Native module not available — skipping push setup');
}

/** Module-level state so any call site can access the push token. */
let currentPushToken: string | null = null;
let registrationStarted = false;

/**
 * Sets up push notification registration and listeners.
 * Call from (tabs)/_layout so it runs once when the tab navigator mounts.
 * The permission dialog is gated on `token` — it will NOT fire for
 * unauthenticated users or during pre-mount by React Navigation.
 */
export function useNotifications() {
  const router = useRouter();
  const { token } = useAuthStore();
  const notificationListener = useRef<{ remove(): void } | null>(null);
  const responseListener = useRef<{ remove(): void } | null>(null);

  useEffect(() => {
    if (!Notifications || !Device || !token) return;
    if (registrationStarted) return;
    registrationStarted = true;

    const Notif = Notifications;

    (async () => {
      if (!Device!.isDevice) {
        if (__DEV__) console.log('[Notifications] Must use physical device for push notifications');
        registrationStarted = false;
        return;
      }

      const { status: existingStatus } = await Notif.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notif.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.log('[Notifications] Permission not granted');
        return;
      }

      const pushToken = await Notif.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (__DEV__) console.log('[Notifications] Push token:', pushToken.data);
      currentPushToken = pushToken.data;

      try {
        await registerPushToken(pushToken.data, Platform.OS, token);
      } catch (err) {
        if (__DEV__) console.error('[Notifications] Failed to register push token:', err);
      }

      if (Platform.OS === 'android') {
        await Notif.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notif.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    })();

    Notif.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    notificationListener.current = Notif.addNotificationReceivedListener((notification) => {
      if (__DEV__) console.log('[Notifications] Received:', notification.request.content.title);
    });

    responseListener.current = Notif.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.venueId && data?.streamId) {
        router.push(`/(tabs)/venues/${data.venueId}/live` as never);
      } else if (data?.venueId) {
        router.push(`/(tabs)/venues/${data.venueId}` as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, router]);

  return { unregisterToken: unregisterNotificationToken };
}

/**
 * Standalone function so dashboard can call it without needing its own hook instance.
 */
export async function unregisterNotificationToken(authToken: string) {
  if (!currentPushToken) return;
  try {
    await unregisterPushToken(currentPushToken, authToken);
    currentPushToken = null;
    registrationStarted = false;
  } catch (err) {
    if (__DEV__) console.error('[Notifications] Failed to unregister push token:', err);
  }
}
