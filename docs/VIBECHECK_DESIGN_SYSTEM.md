# VibeCheck Mobile Design System

Reference this file when implementing UI components in the mobile app.

## Color Palette

### Base Colors (Zinc scale - dark mode primary)
```
--background-primary: #09090b    /* Screen backgrounds */
--background-card: #18181b       /* Cards, inputs, tab bar */
--background-elevated: #27272a   /* Pills, buttons, hover states */
--border-default: #27272a        /* Card borders */
--border-emphasis: #3f3f46       /* Input borders, dividers */
```

### Text Colors
```
--text-primary: #f4f4f5          /* Headings, primary text */
--text-secondary: #a1a1aa        /* Body text, labels */
--text-muted: #71717a            /* Subtitles, placeholders */
--text-faint: #52525b            /* Hints, disabled text */
```

### Accent Colors
```
--live-red: #dc2626              /* Live badges, go live buttons */
--live-red-glow: rgba(220, 38, 38, 0.2)
--success-green: #22c55e         /* Online status, positive states */
--success-green-glow: 0 0 8px #22c55e
--warning-amber: #fbbf24         /* Viewer counts, highlights */
```

## Typography

### Font Sizes
```
Screen title:     28px, weight 600
Card title:       18-22px, weight 600
Body text:        14-15px, weight 400
Label:            13px, weight 400
Caption:          12px, weight 400
Section label:    11px, weight 600, uppercase, letter-spacing: 2px
Badge text:       10-11px, weight 600
```

## Border Radius Scale
```
--radius-sm: 8px       /* Small badges */
--radius-md: 12px      /* Chips, small buttons */
--radius-lg: 16px      /* Inputs, buttons, small cards */
--radius-xl: 20px      /* Cards, filter panels */
--radius-2xl: 24px     /* Large cards, info panels */
--radius-full: 9999px  /* Pills, circular buttons */
```

## Component Specifications

### Screen Layout
```tsx
<SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### Screen Title Block
```tsx
<View className="pb-4 pt-2">
  <Text className="text-3xl font-bold text-zinc-100">Title</Text>
  <Text className="mt-1 text-sm text-zinc-400">Subtitle text here.</Text>
</View>
```

### Filter Pill (Inactive)
```tsx
<Pressable className="rounded-full bg-zinc-800 border border-zinc-700 px-4 py-1.5">
  <Text className="text-xs text-zinc-400">Label</Text>
</Pressable>
```

### Filter Pill (Active)
```tsx
<Pressable className="rounded-full bg-zinc-100 px-4 py-1.5">
  <Text className="text-xs text-zinc-950 font-medium">Label</Text>
</Pressable>
```

### Venue Card (List Item)
```tsx
<Pressable className="bg-zinc-900 border border-zinc-800 rounded-[20px] p-4 flex-row justify-between items-center">
  <View>
    <Text className="text-[15px] font-medium text-zinc-200">Venue Name</Text>
    <Text className="text-xs text-zinc-500">Type · Location</Text>
  </View>
  <View className="flex-row items-center gap-1.5">
    {/* Live dot */}
    <View className="w-2 h-2 rounded-full bg-green-500" style={{ shadowColor: '#22c55e', shadowRadius: 8 }} />
    <Text className="text-xs text-green-500">142</Text>
  </View>
</Pressable>
```

### Featured Venue Card (Live)
```tsx
<View className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-5 border border-stone-700">
  {/* Live badge - absolute positioned */}
  <View className="absolute top-4 right-4 bg-red-600 rounded-xl px-2.5 py-1 flex-row items-center gap-1">
    <PulseDot />
    <Text className="text-[10px] font-semibold text-white">LIVE</Text>
  </View>
  
  <Text className="text-xl font-semibold text-stone-50">Venue Name</Text>
  <Text className="text-xs text-stone-400 mt-1">Type · Location</Text>
  
  <View className="flex-row gap-4 mt-3">
    <Text className="text-xs text-amber-400 font-medium">👁 142 watching</Text>
    <Text className="text-xs text-stone-500">🎵 Amapiano</Text>
  </View>
</View>
```

### Info Card (Venue Detail)
```tsx
<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
  <Text className="text-[22px] font-semibold text-zinc-100">Venue Name</Text>
  <View className="bg-zinc-700 rounded-lg px-2.5 py-1 self-start mt-2 mb-3">
    <Text className="text-[11px] text-zinc-400">NIGHTCLUB</Text>
  </View>
  
  {/* Info rows */}
  <View className="border-t border-zinc-800 pt-3">
    <View className="flex-row justify-between py-2.5 border-b border-zinc-800">
      <Text className="text-[13px] text-zinc-500">Location</Text>
      <Text className="text-[13px] text-zinc-200">123 Main St, City Centre</Text>
    </View>
    {/* More rows... */}
  </View>
</View>
```

### Live Stream Banner
```tsx
<Pressable className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-4 flex-row justify-between items-center">
  <View>
    <View className="flex-row items-center gap-2">
      <PulseDot />
      <Text className="text-sm font-semibold text-white">Live now</Text>
    </View>
    <Text className="text-xs text-white/80 mt-0.5">142 people watching</Text>
  </View>
  <View className="bg-white rounded-2xl px-4 py-2">
    <Text className="text-xs font-semibold text-red-600">Watch →</Text>
  </View>
</Pressable>
```

### Attendance Intent Buttons
```tsx
<View className="flex-row gap-2.5">
  <Pressable className={`flex-1 rounded-2xl p-3.5 items-center ${
    isActive ? 'bg-green-500' : 'bg-zinc-800 border border-zinc-700'
  }`}>
    <Text className="text-lg mb-1">🙋</Text>
    <Text className={`text-[11px] ${isActive ? 'text-white font-medium' : 'text-zinc-400'}`}>
      I'm thinking about it
    </Text>
    <Text className={`text-[11px] mt-1 ${isActive ? 'text-white' : 'text-zinc-500'}`}>23</Text>
  </Pressable>
  {/* Arrived button similar structure */}
</View>
```

### Primary Button
```tsx
<Pressable className="bg-zinc-100 rounded-2xl py-3.5 px-4">
  <Text className="text-center text-[15px] font-semibold text-zinc-950">Button Label</Text>
</Pressable>
```

### Secondary Button
```tsx
<Pressable className="border border-zinc-700 rounded-2xl py-3.5 px-4">
  <Text className="text-center text-[15px] font-medium text-zinc-300">Button Label</Text>
</Pressable>
```

### Go Live Button (Broadcast)
```tsx
<Pressable className="bg-red-600 rounded-[20px] py-4 flex-row items-center justify-center gap-2.5">
  <View className="w-2.5 h-2.5 rounded-full bg-white" />
  <Text className="text-lg font-semibold text-white">Go live</Text>
</Pressable>
```

### Text Input
```tsx
<TextInput
  placeholder="Email"
  placeholderTextColor="#52525b"
  className="bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-[15px] text-zinc-100"
/>
```

### Section Label
```tsx
<Text className="text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500 mb-3">
  Section Title
</Text>
```

### Stat Card (Broadcast)
```tsx
<View className="bg-zinc-900 rounded-2xl p-4 items-center">
  <Text className="text-2xl font-semibold text-zinc-100">142</Text>
  <Text className="text-[11px] uppercase tracking-wider text-zinc-500 mt-1">Viewers</Text>
</View>
```

### Tab Bar
```tsx
<View className="bg-zinc-900 border-t border-zinc-800 px-6 py-3 flex-row justify-around">
  <Pressable className="items-center gap-1">
    <IconComponent size={20} color={isActive ? '#f4f4f5' : '#52525b'} />
    <Text className={`text-[10px] ${isActive ? 'text-zinc-100' : 'text-zinc-600'}`}>
      Browse
    </Text>
  </Pressable>
</View>
```

### Empty State
```tsx
<View className="flex-1 items-center justify-center p-8">
  <View className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center mb-5">
    <Text className="text-3xl">🏢</Text>
  </View>
  <Text className="text-lg font-semibold text-zinc-100 mb-2">No linked venues yet</Text>
  <Text className="text-sm text-zinc-500 text-center leading-relaxed max-w-[260px]">
    Once you own a venue or receive a promoter invite, it will show up here.
  </Text>
</View>
```

### Pulsing Live Dot Component
```tsx
// components/PulseDot.tsx
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export function PulseDot({ size = 6, color = 'white' }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}
```

## Screen Inventory

| Screen | Route | Status |
|--------|-------|--------|
| Browse (Home) | `/(tabs)/index` | ✅ Exists |
| Venue Detail | `/(tabs)/venues/[id]` | ✅ Exists |
| Live Watch | `/(tabs)/venues/[id]/live` | ✅ Exists |
| Dashboard | `/(tabs)/dashboard` | ✅ Exists |
| Login | `/(tabs)/(auth)/login` | ✅ Exists |
| Register | `/(tabs)/(auth)/register` | ✅ Exists |
| Broadcast Setup | `/(tabs)/broadcast/[venueId]` | ✅ Exists |
| Filters Expanded | Component in Browse | ✅ FilterBar exists |

## Recommended Enhancements

1. **Role selection on register** - Add viewer/owner toggle cards
2. **Vibe meter on live watch** - Visual progress bar showing crowd energy
3. **Stream quality indicator** - Show connection status during broadcast
4. **Peak viewers stat** - Track and display during active streams
5. **Onboarding flow** - First-time user walkthrough
6. **Notification preferences** - Push notification settings screen