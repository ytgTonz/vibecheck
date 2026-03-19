import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#71717a',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
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
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'arrow.up.circle', android: 'upload', web: 'upload' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
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
      <Tabs.Screen
        name="venues/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
