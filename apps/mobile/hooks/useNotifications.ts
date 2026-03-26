import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, registerPushToken, unregisterPushToken } from '@vibecheck/shared';

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');

  // Show notifications while app is foregrounded
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Native module unavailable (Expo Go) — push notifications disabled.
  console.log('[Notifications] Native module not available — skipping push setup');
}

export function useNotifications() {
  const router = useRouter();
  const { token } = useAuthStore();
  const notificationListener = useRef<{ remove(): void } | null>(null);
  const responseListener = useRef<{ remove(): void } | null>(null);
  const pushTokenRef = useRef<string | null>(null);

  // Register push token on mount and whenever the auth token changes (links token to user after login)
  useEffect(() => {
    if (!Notifications || !Device) return;

    const Notif = Notifications;

    (async () => {
      if (!Device!.isDevice) {
        console.log('[Notifications] Must use physical device for push notifications');
        return;
      }

      const { status: existingStatus } = await Notif.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notif.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return;
      }

      // Get the Expo push token
      const pushToken = await Notif.getExpoPushTokenAsync({
        projectId: 'c7eb7128-8ab0-4a55-a11f-8d0d9f954d53',
      });

      console.log('[Notifications] Push token:', pushToken.data);
      pushTokenRef.current = pushToken.data;

      // Register token with our API — auth token optional.
      // If logged in, this links the push token to the user account.
      // If not logged in, the token is stored anonymously and still receives broadcast notifications.
      try {
        await registerPushToken(pushToken.data, Platform.OS, token ?? undefined);
      } catch (err) {
        console.error('[Notifications] Failed to register push token:', err);
      }

      // Android notification channel
      if (Platform.OS === 'android') {
        await Notif.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notif.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    })();

    // Foreground notification listener
    notificationListener.current = Notif.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification.request.content.title);
    });

    // Tap notification listener — navigate to relevant screen
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

  async function unregisterToken(authToken: string) {
    if (!pushTokenRef.current) return;
    try {
      await unregisterPushToken(pushTokenRef.current, authToken);
    } catch (err) {
      console.error('[Notifications] Failed to unregister push token:', err);
    }
  }

  return { unregisterToken };
}
