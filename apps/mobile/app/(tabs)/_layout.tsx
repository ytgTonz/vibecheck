import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useBroadcastStore } from '@vibecheck/shared';

function LiveBanner() {
  const router = useRouter();
  const segments = useSegments();
  const { venueId, venueName } = useBroadcastStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isOnBroadcastPage = segments.includes('broadcast' as never);

  useEffect(() => {
    if (!venueId || isOnBroadcastPage) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [venueId, isOnBroadcastPage, pulseAnim]);

  if (!venueId || isOnBroadcastPage) return null;

  return (
    <Pressable
      onPress={() => router.push(`/broadcast/${venueId}` as any)}
      style={{
        backgroundColor: '#FF2D55',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Animated.View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#ffffff',
          opacity: pulseAnim,
        }}
      />
      <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
        You are live at {venueName || 'a venue'} — tap to return
      </Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { user } = useAuthStore();
  const broadcastVenueId = useBroadcastStore((s) => s.venueId);
  const isFullscreenRoute =
    segments.includes('broadcast' as never) ||
    segments.includes('live' as never) ||
    segments.includes('(auth)' as never);

  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#09090b' }}
      edges={isFullscreenRoute ? [] : ['top']}
    >
    <LiveBanner />
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f5f5f5',
        tabBarInactiveTintColor: '#71717a',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          flex: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: isFullscreenRoute
          ? { display: 'none' }
          : {
              height: 62 + insets.bottom,
              paddingTop: 10,
              paddingBottom: insets.bottom,
              paddingHorizontal: 8,
              backgroundColor: '#0c0c0f',
              borderTopColor: '#1f1f23',
            },
        sceneStyle: {
          backgroundColor: '#09090b',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'music.note.house', android: 'home', web: 'home' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={
          canBroadcast
            ? {
                title: 'Go Live',
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      marginTop: -14,
                      height: 54,
                      width: 54,
                      borderRadius: 27,
                      backgroundColor: focused ? '#ff4d6d' : '#FF2D55',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: broadcastVenueId ? 2 : 3,
                      borderColor: broadcastVenueId ? '#BFFF00' : '#18181b',
                      shadowColor: broadcastVenueId ? '#BFFF00' : '#FF2D55',
                      shadowOpacity: broadcastVenueId ? 0.6 : 0.35,
                      shadowRadius: broadcastVenueId ? 18 : 14,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 10,
                    }}
                  >
                    <SymbolView
                      name={{ ios: 'dot.radiowaves.left.and.right', android: 'videocam', web: 'videocam' }}
                      tintColor="#ffffff"
                      size={26}
                    />
                  </View>
                ),
                tabBarLabel: ({ focused }) => (
                  <Text
                    style={{
                      marginTop: 1,
                      fontSize: 11,
                      fontWeight: '700',
                      color: broadcastVenueId
                        ? '#BFFF00'
                        : focused
                          ? '#ff8fa3'
                          : '#FF2D55',
                    }}
                  >
                    {broadcastVenueId ? 'LIVE' : 'Go Live'}
                  </Text>
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: user?.role === 'VIEWER' ? 'Account' : 'Dashboard',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={
                user?.role === 'VIEWER'
                  ? { ios: 'person.crop.circle', android: 'person', web: 'person' }
                  : { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }
              }
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen name="(auth)" options={{ href: null }} />
      <Tabs.Screen name="broadcast/[venueId]" options={{ href: null }} />
      <Tabs.Screen name="venues/[id]" options={{ href: null }} />
    </Tabs>
    </SafeAreaView>
  );
}
