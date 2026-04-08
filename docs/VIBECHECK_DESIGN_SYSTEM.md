# VibeCheck Frontend Design System (Consolidated)

Reference this file when implementing UI in both `apps/web` and `apps/mobile`.

This is a consolidation of the current shipped interface patterns. It captures:
- Shared design language both platforms already use
- Current intentional platform differences
- A baseline contract for future alignment work

## 1) Core Design Intent

- Dark-first UI with zinc neutrals as the base
- Live state is the primary interaction signal
- Venue-first browsing and detail hierarchy
- Compact, rounded components with consistent spacing rhythm

## 2) Design Tokens

### 2.1 Base Surfaces (Shared)
```
--background-primary: #09090b     /* App/background canvas */
--background-card: #18181b        /* Cards, inputs, tab bars */
--background-elevated: #27272a    /* Pills and elevated controls */
--border-default: #27272a         /* Card and surface borders */
--border-emphasis: #3f3f46        /* Inputs, dividers */
```

### 2.2 Text (Shared)
```
--text-primary: #f4f4f5
--text-secondary: #a1a1aa
--text-muted: #71717a
--text-faint: #52525b
```

### 2.3 Accents (Current Runtime)
```
--live-red-system: #dc2626        /* Legacy/spec live red */
--live-red-brand: #FF2D55         /* Current web + mobile brand red */
--brand-lime: #BFFF00             /* Broadcast/live emphasis */
--success-green: #22c55e          /* Positive state */
--warning-amber: #fbbf24          /* Viewer stats / highlights */
```

### 2.4 Radius Scale (Shared)
```
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-3xl: 28px
--radius-full: 9999px
```

## 3) Typography

### 3.1 Functional UI Typography (Cross-platform)
```
Screen title:     28px, weight 700
Card title:       20-26px, weight 600
Body text:        14-16px, weight 400
Label:            13px, weight 400-500
Caption:          12px, weight 400
Section label:    11px, weight 600, uppercase, tracking 2px
Badge text:       10-11px, weight 600
```

### 3.2 Brand Display Typography (Web-specific today)
```
Display headline font: Bebas Neue
Editorial/support font: Source Serif 4
Mono accent font: IBM Plex Mono
```

Use display typography for marketing and brand moments only (`/`, hero/landing sections). Use functional typography for product surfaces (browse, venue detail, live, dashboard, auth).

## 4) Layout Foundations

### 4.1 Mobile
```tsx
<SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### 4.2 Web
```tsx
<main className="mx-auto w-full max-w-6xl px-4 py-8">
  {/* Content */}
</main>
```

## 5) Shared Component Patterns

### 5.1 Screen Title Block
```tsx
<View className="pb-4 pt-2">
  <Text className="text-3xl font-bold text-zinc-100">Title</Text>
  <Text className="mt-1 text-sm text-zinc-400">Subtitle</Text>
</View>
```

### 5.2 Filter Pills
```tsx
// Inactive
<Pressable className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5">
  <Text className="text-xs text-zinc-400">Label</Text>
</Pressable>

// Active
<Pressable className="rounded-full bg-zinc-100 px-4 py-1.5">
  <Text className="text-xs font-medium text-zinc-950">Label</Text>
</Pressable>
```

### 5.3 Venue Card
```tsx
<Pressable className="rounded-[20px] border border-zinc-800 bg-zinc-900 px-5 py-4">
  <Text className="text-base font-semibold text-zinc-100">Venue Name</Text>
  <Text className="mt-1 text-[13px] text-zinc-500">Type · Location</Text>
  {/* Live status and viewer count when live */}
</Pressable>
```

### 5.4 Featured Venue Card
```tsx
<View className="rounded-[28px] border border-zinc-800 bg-zinc-900 p-6">
  {/* Optional top badges: TONIGHT'S PICK, LIVE */}
  <Text className="text-[26px] font-semibold text-zinc-100">Venue Name</Text>
  <Text className="mt-1.5 text-sm text-zinc-400">Type · Location</Text>
</View>
```

### 5.5 Venue Info Card
```tsx
<View className="rounded-[24px] border border-zinc-800 bg-zinc-900 px-5 py-6">
  <Text className="text-[26px] font-semibold text-zinc-100">Venue Name</Text>
  <View className="mt-3 border-t border-zinc-800">
    {/* Label/value rows */}
  </View>
</View>
```

### 5.6 Live Stream Banner
```tsx
<Pressable className="rounded-[24px] bg-brand-red p-4">
  <Text className="text-sm font-semibold text-white">Live now</Text>
  <Text className="text-xs text-white/80">142 people watching</Text>
</Pressable>
```

### 5.7 Attendance Buttons
```tsx
<View className="flex-row gap-2.5">
  <Pressable className="flex-1 rounded-[16px] border border-zinc-700 bg-zinc-800 p-3.5 items-center">
    <Text className="text-[11px] text-zinc-400">I'm thinking about it</Text>
  </Pressable>
  <Pressable className="flex-1 rounded-[16px] border border-zinc-700 bg-zinc-800 p-3.5 items-center">
    <Text className="text-[11px] text-zinc-400">I've arrived!</Text>
  </Pressable>
</View>
```

### 5.8 Buttons
```tsx
// Primary
<Pressable className="rounded-2xl bg-zinc-100 px-4 py-3.5">
  <Text className="text-center text-[15px] font-semibold text-zinc-950">Action</Text>
</Pressable>

// Secondary
<Pressable className="rounded-2xl border border-zinc-700 px-4 py-3.5">
  <Text className="text-center text-[15px] font-medium text-zinc-300">Action</Text>
</Pressable>
```

### 5.9 Inputs
```tsx
<TextInput
  placeholder="Email"
  placeholderTextColor="#52525b"
  className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-[15px] text-zinc-100"
/>
```

### 5.10 Section Label
```tsx
<Text className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">
  Section
</Text>
```

### 5.11 Live Dot / Pulse
Use a small circular live dot with optional pulse animation.
- Idle/offline: zinc dot
- Live: brand red or white (context-dependent), pulse allowed

## 6) Navigation Patterns

### 6.1 Mobile Tab Bar
- Dark tab surface (`bg-zinc-900` to near-black)
- Active icon/text: near-white
- Inactive icon/text: muted zinc
- Broadcast action can be elevated as center visual affordance

### 6.2 Web Top Nav
- Dark top bar with subtle bottom border
- Brand wordmark at left
- Role-aware actions at right
- Optional persistent "you are live" return banner when broadcasting

## 7) Auth and Role Flows (Current)

- Account types: Viewer, Venue Promoter, Venue Owner
- Same functional flow on web/mobile
- Current visual treatment differs:
  - Mobile uses card-style role options with iconography
  - Web uses simpler stacked selector cards

This is accepted in the current consolidated state, but should be unified in the next normalization pass.

## 8) Platform Differences Accepted Today

These are real, shipped differences and are allowed until the next consistency pass:

1. Web uses brand display typography and richer marketing gradients/shadows in select pages.
2. Mobile product surfaces are tighter and more utilitarian.
3. Web browse filters currently mix pills with a native dropdown control.
4. Live red appears in two variants in the codebase (`#dc2626` and `#FF2D55`), with brand red dominating runtime UI.

## 9) Consistency Direction (Next Phase)

When aligning web and mobile to one stricter system, prioritize:
1. Single canonical live red token
2. One filter interaction model for both platforms
3. Shared role selector component structure
4. Unified venue card and featured-card hierarchy
5. Limit decorative gradients/shadows to explicit marketing surfaces

## 10) Screen Inventory

### Mobile
- Browse: `/(tabs)/index`
- Venue Detail: `/(tabs)/venues/[id]`
- Live Watch: `/(tabs)/venues/[id]/live`
- Dashboard: `/(tabs)/dashboard`
- Login/Register: `/(tabs)/(auth)/login`, `/(tabs)/(auth)/register`
- Broadcast Setup: `/(tabs)/broadcast/[venueId]`

### Web
- Landing: `/`
- Browse: `/browse`
- Venue Detail: `/venues/[id]`
- Live Watch: `/venues/[id]/live`
- Login/Register: `/login`
- Dashboard: `/dashboard`
- Admin: `/admin/*`