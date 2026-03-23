import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@vibecheck/shared';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const canBroadcast = useMemo(
    () => user?.role === 'VENUE_OWNER' || user?.role === 'VENUE_PROMOTER',
    [user?.role],
  );

  return (
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
        tabBarStyle: {
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
                      backgroundColor: focused ? '#ef4444' : '#dc2626',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 3,
                      borderColor: '#18181b',
                      shadowColor: '#ef4444',
                      shadowOpacity: 0.35,
                      shadowRadius: 14,
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
                      color: focused ? '#fca5a5' : '#f87171',
                    }}
                  >
                    Go Live
                  </Text>
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen name="broadcast/[venueId]" options={{ href: null }} />
      <Tabs.Screen name="venues/[id]" options={{ href: null }} />
      <Tabs.Screen name="venues/[id]/live" options={{ href: null }} />
    </Tabs>
  );
}
