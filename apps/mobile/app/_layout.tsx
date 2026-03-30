import "../global.css";

try {
  const { registerGlobals } = require('@livekit/react-native');
  registerGlobals();
} catch {
  // Expo Go / missing native module: let feature screens handle the fallback UI.
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthStorage, useAuthStore } from '@vibecheck/shared';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { SourceSerif4_400Regular, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import VibecheckIcon from '@/components/VibecheckIcon';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { useNotifications } from '../hooks/useNotifications';

setAuthStorage({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BebasNeue_400Regular,
    SourceSerif4_400Regular,
    SourceSerif4_600SemiBold,
    IBMPlexMono_400Regular,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  useNotifications();

  useEffect(() => {
    let cancelled = false;

    // Hydrate auth from AsyncStorage immediately — don't wait for the timer.
    const hydratePromise = useAuthStore.getState().hydrate();

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(async () => {
        if (cancelled) return;

        // Ensure hydration is complete before reading user state.
        await hydratePromise;

        const seen = await AsyncStorage.getItem('vc_onboarding_seen');
        const user = useAuthStore.getState().user;

        if (!seen && !user) {
          router.replace('/gate');
        }

        // Hide splash only after the routing decision — prevents a flash of
        // the browse screen while the async checks are in flight.
        setSplashVisible(false);
      });
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router, splashOpacity]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="gate" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        {splashVisible && (
          <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
            <View style={styles.splashInner}>
              <VibecheckIcon size={80} />
              <Text style={styles.splashTitle}>
                {'VIBE'}<Text style={{ color: '#FF2D55' }}>{'CHECK'}</Text>
              </Text>
              <Text style={styles.splashTagline}>Feel the night.</Text>
            </View>
          </Animated.View>
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashInner: {
    alignItems: 'center',
    gap: 12,
  },
  splashTitle: {
    fontSize: 48,
    fontFamily: 'BebasNeue_400Regular',
    color: '#f4f4f5',
    letterSpacing: 2,
  },
  splashTagline: {
    fontSize: 15,
    color: '#71717a',
  },
});
