# Project Index: VibeCheck

Generated: 2026-03-27

## Overview

Nightlife discovery app. Venues stream live to mobile viewers; promoters manage venues and broadcast from web or mobile. Business model: per-venue invoicing based on foot traffic attribution.

## Project Structure

```
vibecheck-app/
├── apps/
│   ├── api/          # Express + Socket.IO backend (Node.js / TypeScript)
│   ├── web/          # Next.js 14 (App Router) — venue management, broadcast, admin
│   ├── mobile/       # Expo / React Native — viewer + promoter broadcast
│   └── landing/      # Vite + React — marketing landing page
├── packages/
│   └── shared/       # Shared types, stores (Zustand), socket helpers, API utils
└── docs/             # Technical overview, business panel analysis
```

## Entry Points

- **API**: `apps/api/src/index.ts` — Express server on port 3001 with Socket.IO
- **Web**: `apps/web/app/layout.tsx` → `apps/web/app/page.tsx`
- **Mobile**: `apps/mobile/app/_layout.tsx` → `apps/mobile/app/(tabs)/_layout.tsx`
- **Landing**: `apps/landing/src/main.jsx`

## Core Modules

### API (`apps/api/src/`)

| Module | Path | Purpose |
|--------|------|---------|
| Server | `src/index.ts` | Express app, Socket.IO init, notification pollers |
| Auth | `src/routes/auth.ts` | JWT login/register, role-based (VENUE_PROMOTER, VENUE_OWNER, ADMIN) |
| Venues | `src/routes/venues.ts` → `venues/public.ts`, `venues/management.ts`, `venues/promoters.ts`, `venues/attendance.ts` | CRUD + promoter invites + attendance tracking |
| Streams | `src/routes/streams.ts` → `streams/broadcast.ts`, `streams/public.ts`, `streams/admin.ts` | LiveKit room mgmt, stream lifecycle |
| Admin | `src/routes/admin.ts` | VO-level oversight: users, venues, streams |
| Notifications | `src/routes/notifications.ts` | Push token registration, in-app notifications |
| Attendance | `src/routes/attendance.ts` | Intent/arrival tracking for foot traffic |
| Feedback | `src/routes/feedback.ts` | In-app feedback collection |
| Webhooks | `src/routes/webhooks.ts` | LiveKit webhook handler (raw body) |
| Socket | `src/lib/socket.ts` | Socket.IO real-time events |
| LiveKit | `src/lib/livekit.ts` | LiveKit server SDK integration |
| Cloudinary | `src/lib/cloudinary.ts` | Media upload helpers |
| VibeScore | `src/lib/vibeScore.ts` | Venue vibe score calculation |
| Prisma | `src/lib/prisma.ts` | DB client singleton |
| Notifications lib | `src/lib/notifications.ts` + `scheduledNotifications.ts` | Expo push + scheduled send |
| Auth middleware | `src/middleware/auth.ts` | JWT verify, role guard |

### Web App (`apps/web/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Home / browse venues |
| `/login` | Auth — account type selector (promoter / owner) |
| `/browse` | Browse all venues |
| `/venues/[id]` | Venue detail page |
| `/venues/[id]/live` | Viewer stream page (BroadcasterVideo, ChatOverlay, EmojiReactions, StreamEndedOverlay) |
| `/dashboard` | Promoter dashboard — venue list + stream status cards |
| `/dashboard/new` | Create venue |
| `/dashboard/edit/[id]` | Edit venue |
| `/dashboard/live/[venueId]` | **Broadcast page** — BroadcasterPreview, BroadcastChat, LiveControls, GoLiveOnPublish, RemoteVideo, ViewerCount |
| `/admin` | Admin dashboard (VO only) |
| `/admin/venues` | Venue management |
| `/admin/users` | User management |
| `/admin/feedback` | Feedback review |
| `/admin/notifications` | Push notification management |

### Mobile App (`apps/mobile/app/(tabs)/`)

| Screen | Purpose |
|--------|---------|
| `index.tsx` | Home feed — featured venues + browse |
| `venues/[id]/index.tsx` | Venue detail |
| `venues/[id]/live.tsx` | Live stream viewer |
| `broadcast/[venueId].tsx` | **Promoter broadcast** — mobile streaming |
| `dashboard.tsx` | Promoter dashboard |
| `upload.tsx` | Clip upload |
| `(auth)/login.tsx` + `register.tsx` | Auth screens |

### Shared Package (`packages/shared/src/`)

| Export | Purpose |
|--------|---------|
| `api.ts` | API base URL, typed fetch helpers |
| `venues.ts` | Venue type definitions |
| `socket.ts` | `getSocket`, `disconnectSocket`, event types |
| `stores/venueStore` | Zustand venue store |
| `stores/authStore` | Zustand auth store + token storage |
| `stores/broadcastStore` | Zustand broadcast state |
| `hooks/useSocket` | Socket.IO React hook |

## Database Schema (Prisma / PostgreSQL)

| Model | Key Fields |
|-------|-----------|
| `Venue` | id, name, type (VenueType), location, city, musicGenre[], ownerId |
| `User` | id, email, role (VENUE_PROMOTER / VENUE_OWNER / ADMIN) |
| `VenuePromoter` | userId + venueId join (many-to-many) |
| `Invite` | code, venueId, expiresAt, used — invite-based promoter onboarding |
| `LiveStream` | id, venueId, livekitRoom, status (IDLE/LIVE/ENDED), viewerPeak |
| `StreamAttendance` | deviceId, streamId, type (INTENT/ARRIVAL) — foot traffic data |
| `PushToken` | userId?, token, platform — Expo push tokens |
| `Notification` | type, title, body, userId?, read |
| `ScheduledNotification` | scheduledFor, sent — scheduled push delivery |
| `Feedback` | category, rating, message, userId |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `livekit-server-sdk` | Server-side room/token management |
| `@livekit/react-native` | Mobile streaming SDK |
| `prisma` / `@prisma/client` | ORM — PostgreSQL |
| `socket.io` / `socket.io-client` | Real-time events (viewer counts, chat, reactions) |
| `expo` / `expo-router` | Mobile app framework with file-based routing |
| `next` (v14) | Web framework — App Router |
| `cloudinary` | Media storage |
| `expo-notifications` | Push notifications |
| `zustand` | State management (shared package) |
| `zod` | Schema validation |
| `jsonwebtoken` | JWT auth |

## Configuration Files

| File | Purpose |
|------|---------|
| `apps/api/prisma.config.ts` | Prisma config |
| `apps/web/next.config.ts` | Next.js config |
| `apps/mobile/tailwind.config.js` | NativeWind (Tailwind for RN) |
| `apps/mobile/metro.config.js` | Metro bundler config |
| `apps/mobile/babel.config.js` | Babel config |
| `apps/landing/vite.config.js` | Vite config for landing |
| `vercel.json` | Vercel deployment config |
| `.vercel/project.json` | Vercel project ID |

## Deployment

- **API**: Heroku (`heroku-postbuild` script in root `package.json`)
- **Web**: Vercel (configured via `vercel.json`)
- **Mobile**: Expo (EAS build assumed)
- **DB**: PostgreSQL (hosted, URL via env)

## Quick Start

```bash
# Install all workspaces
npm install

# Run API (from apps/api)
npm run dev

# Run web (from apps/web)
npm run dev

# Run mobile (from apps/mobile)
npx expo start

# Seed DB
npx tsx apps/api/prisma/seed.ts
```

## Key Docs

- `docs/VIBECHECK_TECHNICAL_OVERVIEW.md` — Full technical architecture
- `docs/business-panel-analysis.md` — Business model analysis
- `docs/livekit-v1.2-plan-concerns.md` — LiveKit integration notes
