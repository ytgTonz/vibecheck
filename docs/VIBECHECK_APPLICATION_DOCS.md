# VibeCheck Application Documentation

> Generated: 2026-04-10 | Comprehensive technical reference for all VibeCheck modules

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [API Reference](#3-api-reference)
4. [Shared Package](#4-shared-package)
5. [Web Application](#5-web-application)
6. [Mobile Application](#6-mobile-application)
7. [Real-Time System](#7-real-time-system)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Broadcast System](#9-broadcast-system)
10. [Attendance & QR System](#10-attendance--qr-system)
11. [Landing Page](#11-landing-page)

---

## 1. Architecture Overview

```
                    +------------------+
                    |   Landing Page   |  Vite + React (standalone)
                    |  apps/landing/   |  Waitlist capture
                    +------------------+

+----------------+     +----------------+     +------------------+
|   Web App      |     |   Mobile App   |     |   Admin Panel    |
|  Next.js 14    |     |  Expo / RN     |     |  (within Web)    |
|  apps/web/     |     |  apps/mobile/  |     |  /admin routes   |
+-------+--------+     +-------+--------+     +--------+---------+
        |                       |                       |
        +----------+------------+-----------------------+
                   |
          +--------v--------+
          | Shared Package  |  Types, Stores, API client,
          | packages/shared |  Socket client, Hooks
          +--------+--------+
                   |
          +--------v--------+     +-----------------+
          |   Express API   |---->|   PostgreSQL    |
          |  Socket.IO      |     |   (Prisma ORM)  |
          |  apps/api/      |     +-----------------+
          +--------+--------+
                   |
          +--------v--------+     +-----------------+
          |    LiveKit      |     |   Cloudinary    |
          |  (Streaming)    |     |   (Media)       |
          +----------------+      +-----------------+
```

**Stack Summary:**

| Layer | Technology | Location |
|-------|-----------|----------|
| API | Express + Socket.IO + Prisma | `apps/api/` |
| Web | Next.js 14 (App Router) | `apps/web/` |
| Mobile | Expo + React Native | `apps/mobile/` |
| Landing | Vite + React | `apps/landing/` |
| Shared | TypeScript + Zustand | `packages/shared/` |
| Database | PostgreSQL | Prisma schema |
| Streaming | LiveKit | Server SDK + Client SDKs |
| Push | Expo Notifications | Server + Mobile |

**Deployment:** API on Heroku, Web on Vercel, Mobile via Expo EAS, DB on hosted PostgreSQL.

---

## 2. Database Schema

**Location:** `apps/api/prisma/schema.prisma`

### 2.1 Entity Relationship Diagram

```
User (1) ──── (n) Venue              (owner)
User (1) ──── (n) VenuePromoter      (many-to-many join)
User (1) ──── (n) Invite             (created by)
User (1) ──── (n) LiveStream         (created by)
User (1) ──── (n) VenueVisit         (visitor)
User (1) ──── (n) AttendanceQRToken  (visitor)
User (1) ──── (n) PushToken          (device tokens)
User (1) ──── (n) Notification       (recipient)
User (1) ──── (n) Feedback           (submitter)

Venue (1) ──── (n) VenuePromoter
Venue (1) ──── (n) Invite
Venue (1) ──── (n) LiveStream
Venue (1) ──── (n) VenueIncentive
Venue (1) ──── (n) VenueVisit
Venue (1) ──── (n) AttendanceQRToken

LiveStream (1) ──── (n) StreamAttendance

VenueIncentive (1) ──── (n) VenueVisit
VenueIncentive (1) ──── (n) AttendanceQRToken

VenueVisit (1) ──── (0..1) AttendanceQRToken
```

### 2.2 Enums

| Enum | Values |
|------|--------|
| `UserRole` | VENUE_PROMOTER (default), VENUE_OWNER, ADMIN, VIEWER |
| `VenueType` | NIGHTCLUB, BAR, RESTAURANT_BAR, LOUNGE, SHISA_NYAMA, ROOFTOP, OTHER |
| `StreamStatus` | IDLE, LIVE, ENDED |
| `AttendanceType` | INTENT, ARRIVAL |
| `NotificationType` | STREAM_LIVE, STREAM_ENDED, VENUE_CREATED, USER_REGISTERED, ATTENDANCE_INTENT |
| `FeedbackCategory` | BUG, SUGGESTION, GENERAL |
| `FeedbackRating` | BAD, NEUTRAL, GOOD |

### 2.3 Key Models

**User** — `id, email, password, name, role, phone, emailVerified, phoneVerified, emailVerifyToken, phoneOtp, createdAt`

**Venue** — `id, name, type, location, city, hours?, musicGenre[], coverCharge?, drinkPrices?, ownerId, createdAt, updatedAt`
- Indexed: `(ownerId, createdAt)`

**LiveStream** — `id, venueId, livekitRoom, status, startedAt?, endedAt?, currentViewerCount, viewerPeak, createdBy, createdAt`
- Indexed: `(venueId, status)`, `(status)`

**StreamAttendance** — `id, deviceId, streamId, venueId?, type, userId?, createdAt`
- Unique: `(deviceId, streamId, type)` — idempotent per device
- Indexed: `(streamId, type)`, `(venueId, createdAt)`

**VenueVisit** — `id, userId, venueId, streamId?, intentAt, arrivedAt?, incentiveId?, createdAt`
- Unique: `(userId, venueId, streamId)` — note: nullable streamId not enforced by Postgres for null values

**AttendanceQRToken** — `id, token (unique), userId, venueId, visitId (unique), incentiveId?, expiresAt, usedAt?, claimedAt?, createdAt`
- Single-use, atomically redeemed via `updateMany` with `usedAt: null` guard

**VenueIncentive** — `id, venueId, title, description, expiresAt?, active, createdAt`

**Invite** — `id, code (unique), venueId, createdBy, used, usedBy?, usedAt?, expiresAt, createdAt`
- Code: 8-char uppercase hex, 7-day expiry

**PushToken** — `id, userId? (nullable for anonymous), token, platform, createdAt`

**Notification** — `id, type, title, body, data?, userId?, read, createdAt`

**ScheduledNotification** — `id, type, title, body, data?, userId?, scheduledFor, sent, createdAt`

**Feedback** — `id, category, rating, message?, userId, createdAt`

---

## 3. API Reference

**Base URL:** `http://localhost:3001` (dev) | Production via env  
**Entry Point:** `apps/api/src/index.ts`

### 3.1 Server Configuration

- **CORS:** `origin: '*'`
- **Body Parser:** `express.json()` (raw body on `/webhooks` routes, registered first)
- **Logging:** Morgan with ISO timestamp, method, URL, status, response time, client IP
- **Socket.IO:** Path `/ws`, CORS `*`, auth via JWT in handshake
- **Background:** Notification poller (60s interval), receipt poller (15min interval)
- **Health:** `GET /health` returns `{ status: 'ok' }`

### 3.2 Authentication Routes (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register (owner/promoter/viewer) |
| GET | `/auth/verify-email` | None | Email verification via token |
| POST | `/auth/verify-phone` | Required | OTP phone verification |
| POST | `/auth/login` | None | Email/password login |
| PATCH | `/auth/me` | Required | Update display name |

**Register payloads by account type:**

- **Owner:** `{ accountType: 'owner', email, password, name, venue: { name, type, location, hours?, musicGenre?, coverCharge?, drinkPrices? } }` — creates user + venue in transaction
- **Promoter:** `{ accountType: 'promoter', email, password, name, inviteCode }` — validates invite, creates user + VenuePromoter link
- **Viewer:** `{ accountType: 'viewer', email, password, displayName, phone }` — creates user with verification tokens

**Auth response:** `{ token, user: { id, email, name, role, phone, emailVerified, phoneVerified, createdAt }, otpDebug?, verificationLinks? }`

**JWT:** HS256, 7-day expiry, secret from `JWT_SECRET` env var.

### 3.3 Venue Routes (`/venues`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/venues` | None | — | List all venues ranked by vibe score |
| GET | `/venues/:id` | None | — | Single venue with active stream info |
| GET | `/venues/:id/incentive` | None | — | Active incentive for venue |
| GET | `/venues/my/venues` | Required | Any | User's owned/promoted venues |
| POST | `/venues` | Required | VENUE_OWNER | Create venue |
| PATCH | `/venues/:id` | Required | VENUE_OWNER | Update venue (owner only) |
| POST | `/venues/:id/invite` | Required | VENUE_OWNER | Generate 7-day promoter invite code |
| GET | `/venues/:id/promoters` | Required | VENUE_OWNER | List venue promoters |
| DELETE | `/venues/:id/promoters/:userId` | Required | VENUE_OWNER | Remove promoter |
| GET | `/venues/:id/attendance-summary` | Required | Owner/Promoter/Admin | Paginated attendance by day/stream |
| GET | `/venues/:id/visit-stats` | Required | Owner/Promoter/Admin | Coming/arrived/claimed counts |

**Vibe Score Algorithm** (max 100 pts):
- Live now: **40 pts**
- Current viewers: **25 pts** (linear, capped at 50 viewers)
- Historical avg peak: **20 pts** (last 10 ended streams, capped at 40 viewers)
- Stream frequency: **15 pts** (streams in last 7 days, capped at 5)

### 3.4 Stream Routes (`/streams`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/streams/active` | None | — | All LIVE streams with venue info |
| GET | `/streams/venue/:venueId/recent` | None | — | Last 10 ended streams with attendance |
| GET | `/streams/:id` | None | — | Single stream details |
| GET | `/streams/:id/viewer-token` | Optional | — | LiveKit viewer JWT (uses real name if auth'd) |
| POST | `/streams` | Required | Venue member | Create IDLE stream |
| POST | `/streams/:id/token` | Required | Stream creator | Broadcaster LiveKit JWT |
| POST | `/streams/:id/go-live` | Required | Stream creator | IDLE -> LIVE transition |
| POST | `/streams/:id/end` | Required | Creator/Owner/Admin | End stream, delete LiveKit room |
| POST | `/streams/end-all` | Required | ADMIN | Force-end all active streams |

**Stream Lifecycle:** Create (IDLE) -> Get broadcaster token -> Go Live (LIVE) -> End (ENDED)  
**Stale cleanup:** IDLE streams >1 hour old are expired before creating new ones.

### 3.5 Attendance Routes (`/attendance`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/attendance/intent` | Optional | — | Record "I'm Coming" (device-based, idempotent) |
| POST | `/attendance/arrival` | Optional | — | Record "I'm Here" (device-based, idempotent) |
| GET | `/attendance/:streamId/counts` | None | — | Current intent/arrival counts |

**Request:** `{ streamId, deviceId }`  
**Response:** `{ intentCount, arrivalCount, alreadyPressed }`  
**Side effect (intent, auth'd):** Creates scheduled notification reminder (30-60 min delay).

### 3.6 Visit & QR Routes (`/visits`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/visits/intent` | Required | VIEWER | Record venue visit intent |
| POST | `/visits/arrival` | Required | VIEWER | Generate single-use QR token (requires phone verified) |
| GET | `/visits/qr/:token` | None | — | Preview QR validity and incentive |
| POST | `/visits/qr/:token/redeem` | Required | Venue member | Redeem QR (atomic, single-use) |

**QR token expiry:** 4 hours or incentive expiry, whichever is sooner.  
**Redemption:** Uses conditional `updateMany` with `usedAt: null` to handle concurrent races.

### 3.7 Incentive Routes (`/incentives`)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/incentives` | Required | Owner/Admin | Create incentive (deactivates previous) |
| PATCH | `/incentives/:id` | Required | Owner/Admin | Update incentive |

### 3.8 Notification Routes (`/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notifications/push-token` | Optional | Register Expo push token |
| DELETE | `/notifications/push-token` | Required | Unregister push token |
| GET | `/notifications` | Required | Paginated user notifications |
| PATCH | `/notifications/:id/read` | Required | Mark as read |

### 3.9 Feedback Routes (`/feedback`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/feedback` | Required | Submit feedback (category + rating + message?) |

### 3.10 Admin Routes (`/admin`)

All require `ADMIN` role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform overview (counts, breakdowns, recent activity) |
| GET | `/admin/feedback` | Paginated feedback with category/rating/search filters |
| GET | `/admin/users` | Paginated users with role/search filters |
| DELETE | `/admin/users/:id` | Delete user with cascade (rejects self-delete and ADMIN targets) |
| GET | `/admin/venues` | Paginated venues with type/search filters |
| DELETE | `/admin/venues/:id` | Delete venue with cascade |

### 3.11 Webhooks (`/webhooks`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/livekit` | LiveKit webhook receiver (HMAC verified) |

**Events handled:**
- `room_started` — Room created (stays IDLE)
- `track_published` — Backup IDLE -> LIVE transition when camera video published
- `room_finished` — Transitions all non-ENDED streams to ENDED
- `participant_joined` — Atomically increments `currentViewerCount`, updates `viewerPeak`
- `participant_left` — Atomically decrements `currentViewerCount` (floors at 0)

### 3.12 Library Modules

| Module | File | Purpose |
|--------|------|---------|
| Prisma Client | `lib/prisma.ts` | PG adapter singleton |
| Socket.IO | `lib/socket.ts` | `initSocket()`, `getIO()`, event emission |
| LiveKit | `lib/livekit.ts` | `createToken()`, `roomService`, `webhookReceiver` (6hr TTL) |
| Notifications | `lib/notifications.ts` | DB persist + Expo push + Socket.IO dispatch |
| Scheduled Notifications | `lib/scheduledNotifications.ts` | 60s poller + 15min receipt pruner |
| Venue Auth | `lib/venueAuth.ts` | `isVenueMember()`, `isVenueOwner()` |
| Vibe Score | `lib/vibeScore.ts` | Dynamic score computation (max 100) |
| Admin Helpers | `lib/adminHelpers.ts` | Cascade delete operations |
| Constants | `lib/constants.ts` | Validation arrays (categories, ratings, roles, venue types) |
| Cloudinary | `lib/cloudinary.ts` | Configured SDK instance |

### 3.13 Middleware

| Middleware | Purpose |
|------------|---------|
| `requireAuth` | Extracts JWT from `Authorization: Bearer` header, attaches `req.user`, returns 401 |
| `optionalAuth` | Same as above but silently proceeds if missing/invalid |
| `requireRole(...roles)` | Checks `req.user.role` against allowed roles, returns 403 |

---

## 4. Shared Package

**Location:** `packages/shared/src/`  
**Consumed by:** Web, Mobile (not Landing)

### 4.1 Exports

```typescript
// Types & Enums
export * from './types'           // VenueType, UserRole, StreamStatus, Venue, User, LiveStream, etc.

// API Client
export * from './api'             // 40+ typed fetch functions, setBaseUrl(), getBaseUrl()

// Venue Utilities
export * from './venues'          // venueTypeLabel, VENUE_TYPE_OPTIONS, MUSIC_GENRES, filterVenues(), groupBrowseVenues()

// Zustand Stores
export { useAuthStore, setAuthStorage } from './stores/authStore'
export { useVenueStore, VenueSection } from './stores/venueStore'
export { useBroadcastStore } from './stores/broadcastStore'

// Socket
export { getSocket, disconnectSocket } from './socket'
export type { StreamEvent, ViewerEvent, NotificationEvent, AttendanceUpdateEvent } from './socket'

// Hooks
export { useSocket } from './hooks/useSocket'
export { useVenueLiveUpdates } from './hooks/useVenueLiveUpdates'
export { useRequireAuth } from './hooks/useRequireAuth'
```

### 4.2 Zustand Stores

#### authStore

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Authenticated user |
| `token` | `string \| null` | JWT token |
| `hydrated` | `boolean` | Initial load complete |
| `loading` | `boolean` | Request in flight |
| `error` | `string \| null` | Last error |

| Action | Description |
|--------|-------------|
| `register(payload)` | Register, save token + user |
| `login(email, password)` | Login, save credentials |
| `logout()` | Clear auth & storage |
| `hydrate()` | Restore from storage on mount |
| `setUser(user)` | Update user (after verification) |
| `setAuth(token, user)` | Manual auth set |

**Storage:** localStorage (web) or custom adapter via `setAuthStorage()` (mobile/AsyncStorage). Keys: `vibecheck_token`, `vibecheck_user`.

#### venueStore

| State | Type | Description |
|-------|------|-------------|
| `venues` | `Venue[]` | All venues |
| `loading` | `boolean` | Fetch in progress |
| `venueTypeFilter` | `VenueType \| null` | Active type filter |
| `musicGenreFilter` | `string \| null` | Active genre filter |

| Action | Description |
|--------|-------------|
| `loadVenues()` | Fetch all from `/venues` |
| `setVenueTypeFilter(type)` | Set/clear filter |
| `setMusicGenreFilter(genre)` | Set/clear filter |
| `clearFilters()` | Reset both |
| `filteredVenues()` | Derived filtered list |
| `groupedVenues()` | Returns `{ live, offline }` |
| `setVenueLive(venueId, streamId)` | Mark live (from socket) |
| `setVenueOffline(venueId)` | Mark offline (from socket) |
| `setViewerCount(venueId, count)` | Update count (from socket) |

#### broadcastStore

| State | Type |
|-------|------|
| `venueId` | `string \| null` |
| `streamId` | `string \| null` |
| `venueName` | `string \| null` |
| `livekitToken` | `string \| null` |

Actions: `setBroadcast(...)`, `clearBroadcast()`

### 4.3 Socket Client

**Configuration:** Singleton pattern, path `/ws`, transports `['websocket', 'polling']`, auto-reconnect with 1-5s delay.

| Event | Payload | Description |
|-------|---------|-------------|
| `stream:started` | `{ venueId, streamId }` | Stream created (IDLE) |
| `stream:live` | `{ venueId, streamId }` | Stream went LIVE |
| `stream:ended` | `{ venueId, streamId }` | Stream ended |
| `stream:viewers` | `{ venueId, streamId, currentViewerCount }` | Viewer count change |
| `notification` | `{ type, title, body, data? }` | Push notification |
| `attendance:update` | `{ venueId, streamId, intentCount, arrivalCount }` | Attendance change |

### 4.4 Hooks

**useSocket(handlers)** — Subscribe to socket events with automatic cleanup on unmount.

**useRequireAuth(redirect, redirectTo?)** — Auth guard that hydrates on mount, redirects if unauthenticated. Returns `{ user, token, hydrated, ready }`.

**useVenueLiveUpdates(setLocalVenues)** — Syncs local state + venueStore with `stream:live`, `stream:ended`, `stream:viewers` events.

### 4.5 Venue Utilities

```typescript
venueTypeLabel: Record<string, string>      // 'NIGHTCLUB' -> 'Nightclub'
VENUE_TYPE_OPTIONS: { value, label }[]      // All 7 types for dropdowns
MUSIC_GENRES: string[]                       // 10 genres: Afrobeats, Amapiano, R&B, Hip Hop, House, Jazz, Soul, Kwaito, Dancehall, Other
filterVenues(venues, typeFilter, genreFilter): Venue[]
groupBrowseVenues(venues): { live, offline }
pickFeaturedVenue(groups): Venue | null     // Highest vibe from live, fallback to offline
excludeFeaturedVenue(venues, featured): Venue[]
```

### 4.6 API Client

**Base URL:** Reads `NEXT_PUBLIC_API_URL` (web) or `EXPO_PUBLIC_API_URL` (mobile), falls back to `http://localhost:3001`.

**Headers:** All requests include `X-Client: 'web' | 'mobile' | 'unknown'`.

40+ typed functions covering all API endpoints. Auth-required functions accept `token` as parameter. See [Section 3](#3-api-reference) for full endpoint list.

---

## 5. Web Application

**Location:** `apps/web/`  
**Framework:** Next.js 14 (App Router)  
**Entry:** `app/layout.tsx` -> `app/page.tsx`

### 5.1 Route Map

| Route | Auth | Role | Purpose |
|-------|------|------|---------|
| `/` | None | — | Marketing landing with CTAs |
| `/login` | None | — | Login/register (mode + accountType params) |
| `/login/verify-phone` | Required | — | Phone OTP verification |
| `/browse` | None | — | Real-time venue discovery with filters |
| `/venues/[id]` | None | — | Venue detail (info, attendance, live banner) |
| `/venues/[id]/live` | None | — | Fullscreen live stream viewer |
| `/account` | Required | Any | Profile management |
| `/dashboard` | Required | Owner/Promoter | Venue management hub |
| `/dashboard/new` | Required | VENUE_OWNER | Create venue form |
| `/dashboard/edit/[id]` | Required | VENUE_OWNER | Edit venue form |
| `/dashboard/live/[venueId]` | Required | Owner/Promoter | Broadcast page (fullscreen) |
| `/dashboard/scan/[venueId]` | Required | Owner/Promoter | QR scanner (fullscreen) |
| `/admin` | Required | ADMIN | Platform overview dashboard |
| `/admin/users` | Required | ADMIN | User management (search, filter, delete) |
| `/admin/venues` | Required | ADMIN | Venue management (search, filter, delete) |
| `/admin/feedback` | Required | ADMIN | Feedback review (search, filter) |
| `/admin/notifications` | Required | ADMIN | Notification management |

### 5.2 Key Components

#### Layout & Navigation
- **NavBar** — Sticky top nav, role-based items, "Go Live" venue picker modal, broadcasting notification bar, scroll animations
- **FeedbackButton** — Floating panel with rating/category/message form (hidden on admin routes)
- **Toast system** — Context provider, auto-dismiss (4s), max 3 visible

#### Browse & Venue
- **VenueCard** — Clickable card with live/offline badge, type, location, genres
- **FeaturedVenueCard** — "Tonight's Pick" highlighted card
- **FilterBar** — Venue type pills + music genre dropdown, backed by venueStore
- **AttendanceCard** — Coming/arrived counts on venue detail
- **StreamFunnelCard** — Expandable recent streams with viewer/intent/arrival funnel

#### Broadcast (dashboard/live/[venueId])
- **BroadcasterPreview** — Local camera via @livekit/components-react
- **BroadcastChat** — 20-message chat with pending message tracking
- **LiveControls** — Camera/mic toggle + end stream
- **ViewerCount** — Remote participant counter
- **GoLiveOnPublish** — Auto-fires `goLiveStream()` when camera track detected

#### Live Viewer (venues/[id]/live)
- **BroadcasterVideo** — Remote video track display
- **ChatOverlay** — Viewer chat interface
- **EmojiReactions** — Floating emoji animations
- **AttendanceBar** — "Thinking of going" / "I'm here" buttons
- **BottomBar** — Chat toggle, share, bookmark
- **StreamEndedOverlay** — End state with navigation

#### Dashboard
- **VenueStreamCard** — Venue card with stats, actions, recent streams, promoter/incentive panels
- **PromoterPanel** — Generate invites, list/remove promoters
- **IncentivePanel** — Create/manage venue incentives

#### Admin
- Paginated tables (users, venues, feedback) with search and filters
- Responsive: card grid on mobile, table on desktop
- Delete operations with confirmation

### 5.3 Styling

- **Tailwind CSS v4** with PostCSS
- **Dark theme only:** `bg-zinc-950`, `text-zinc-100`
- **Brand colors:** Red `#FF2D55` (CTAs, live indicators), Lime `#BFFF00` (secondary accents)
- **Fonts:** Bebas Neue (headings), Source Serif 4 (body), IBM Plex Mono (code/technical)
- **Patterns:** Glass morphism (`bg-black/50 backdrop-blur-sm`), rounded corners, zinc palette borders
- **Responsive:** Mobile-first with `sm:`, `md:`, `lg:` breakpoints

### 5.4 Key Integrations

- **LiveKit:** `@livekit/components-react` for broadcast and viewer video/audio/chat
- **Socket.IO:** `useSocket()` hook for real-time venue status, attendance, notifications
- **Device ID:** Persistent UUID via localStorage (`vibecheck_device_id`) for anonymous attendance

---

## 6. Mobile Application

**Location:** `apps/mobile/`  
**Framework:** Expo + React Native + Expo Router (file-based routing)  
**Entry:** `app/_layout.tsx`

### 6.1 Route Map

| Route | Auth | Role | Purpose |
|-------|------|------|---------|
| `/gate` | None | — | Unauthenticated landing (browse/sign-in/register) |
| `/(tabs)/` | None | — | Browse venues (home feed) |
| `/(tabs)/upload` | Required | Owner/Promoter | Go Live hub |
| `/(tabs)/dashboard` | Required | Any | Account (viewer) or venue management (owner/promoter) |
| `/(tabs)/scanner` | Required | Owner/Promoter | QR code scanner (hidden tab) |
| `/(tabs)/broadcast/[venueId]` | Required | Owner/Promoter | Mobile broadcast room |
| `/(tabs)/venues/[id]` | None | — | Venue detail |
| `/(tabs)/venues/[id]/live` | Required | Any | Live stream viewer |
| `/(tabs)/(auth)/login` | None | — | Login screen |
| `/(tabs)/(auth)/register` | None | — | Registration (account type selector) |
| `/(tabs)/(auth)/verify-phone` | Required | — | OTP verification |

### 6.2 Key Screens

#### Browse (index.tsx)
- Venue discovery with real-time socket updates
- Featured venue card, live/offline sections
- Filter by venue type and music genre
- Pull-to-refresh, offline detection, one-time tooltip

#### Dashboard (dashboard.tsx)
- **Viewer role:** Profile with verification status, edit name, logout
- **Owner/Promoter role:** Venue list with stats, go live, scan QR, view stream

#### Upload (upload.tsx)
- Broadcast launch point listing linked venues
- Shows live/offline status per venue

#### Scanner (scanner.tsx)
- Camera-based QR scanning with UUID validation
- State machine: scanning -> loading -> previewing -> redeeming -> success/error
- Manual token entry fallback
- Haptic feedback on redeem

#### Broadcast (broadcast/[venueId].tsx)
- **Setup phase:** Camera preview, flip camera, venue info, go live button
- **Live phase:** Full broadcast controls (camera/mic/flip/end), LIVE badge with timer, real-time stats (viewers, coming, arrived), chat overlay
- Audio session management (speaker priority)

#### Live Viewer (venues/[id]/live.tsx)
- Fullscreen video with chat, emoji reactions, attendance tracking
- Quick reactions (fire, heart, clap) with floating animations
- QR code generation for door check-in
- Auto-retry with exponential backoff (5 attempts)
- Auth gate for guests, stream ended overlay with reconnect

#### Venue Detail (venues/[id]/index.tsx)
- Venue info, live banner, attendance buttons, saved QR display
- Pull-to-refresh, auto-refresh stream status every 10s

### 6.3 Key Components

#### Navigation & Layout
- **VibecheckIcon** — App logo (SVG-like geometry)
- **OfflineBanner** — Connectivity status with spring animation
- Dynamic tab visibility based on role and current route

#### Browse
- **VenueCard** — Horizontal card with live badge + viewer count
- **FeaturedVenueCard** — "TONIGHT'S PICK" highlighted card
- **FilterBar** — Collapsible pills + expandable drawer with apply/clear

#### Broadcast
- **BroadcastSetupScreen** — Pre-broadcast config with camera preview
- **BroadcasterPreview** — LiveKit local video track
- **BroadcastRoom** — Full control interface with stats grid and chat
- **GoLiveOnPublish** — Auto-triggers go-live API when camera publishes

#### Live Viewing
- **LiveRoomContent** — Main composition orchestrating all live UI
- **LiveVideoStage** — Remote video or "waiting for broadcaster"
- **LiveHeader** — Venue name, LIVE badge, viewer count, share/QR buttons
- **LiveChatOverlay** — Message list with avatar, names, timestamps, keyboard handling
- **LiveReactions** — Quick reactions + floating bubble animations (Reanimated)
- **LiveAttendanceBar** — "Thinking of going" / "I'm here" with count display
- **LiveBottomBar** — Chat toggle + share stream
- **StreamEndedOverlay** — End state with reconnect option
- **LiveAuthGate** — Sign-in prompt for guests
- **QRModal** — Fullscreen QR display with countdown timer and incentive

#### Venue Detail
- **VenueInfoCard** — Full venue info display
- **VenueAttendanceCard** — Intent/arrival buttons with QR modal
- **SavedQRCard** — Previously generated QR codes from AsyncStorage
- **LiveStreamBanner** — Red "Live now" banner with viewer count

#### Auth
- **AccountTypeSelector** — Viewer/Promoter/Owner selection
- **VenueRegistrationFields** — Owner-specific venue fields
- **PromoterInviteField** — Invite code input

#### Scanner
- **ScannerCamera** — Camera with QR viewfinder overlay (lime brackets)
- **ScanResultSheet** — Bottom sheet with preview/redeem/success/error states

### 6.4 Native Integrations

| Feature | Library | Usage |
|---------|---------|-------|
| Camera | expo-camera | QR scanning, broadcast preview |
| Audio | @livekit/react-native AudioSession | Speaker/Bluetooth config per role |
| LiveKit | @livekit/react-native + livekit-client | Video streaming (broadcast + viewer) |
| QR Codes | react-native-qrcode-svg | Generate arrival QR codes |
| Notifications | expo-notifications | Push tokens, deep link handling |
| Network | @react-native-community/netinfo | Connectivity monitoring |
| Storage | @react-native-async-storage | Auth, attendance, QR persistence |
| Sharing | React Native Share | Share stream/venue URLs |
| Device | expo-device | Physical device check for notifications |
| Haptics | expo-haptics | QR redeem feedback |

### 6.5 Styling

- **NativeWind** (Tailwind for React Native)
- **Dark theme only:** `bg-zinc-950`, `text-zinc-100`
- **Brand colors:** Red `#FF2D55`, Lime `#BFFF00`
- **Fonts:** BebasNeue, SourceSerif4, IBMPlexMono, SpaceMono
- **Icons:** @expo/vector-icons (Ionicons)
- **Animations:** Reanimated (reactions, keyboard, banners)

### 6.6 Offline & Error Handling

- **NetworkProvider** context with `isConnected`, `didReconnect`, `clearReconnect()`
- OfflineBanner (red) on disconnect, "Back online" (green) on reconnect
- Screens auto-refresh on reconnect (browse, dashboard, venue detail)
- Stream fetch retries: 5 attempts with exponential backoff (1s, 2s, 4s, 8s, 16s)
- Token fetch retries: 3 attempts with backoff
- Graceful LiveKit fallback when native modules unavailable (Expo Go)

---

## 7. Real-Time System

### 7.1 Socket.IO Architecture

**Server:** Initialized in `apps/api/src/lib/socket.ts` on the HTTP server, path `/ws`.

**Authentication:** Clients pass JWT in `socket.handshake.auth.token`. Valid tokens join `user:{userId}` and `role:{role}` rooms for targeted messaging. Invalid tokens still connect (for public events).

**Event Flow:**

```
API (emit) ──> Socket.IO Server ──> Connected Clients
                                     ├── All clients (broadcast)
                                     ├── user:{id} room (targeted)
                                     └── role:{role} room (role-based)
```

### 7.2 Events

| Event | Source | Payload | Consumers |
|-------|--------|---------|-----------|
| `stream:started` | Stream creation | `{ venueId, streamId }` | Browse (web/mobile) |
| `stream:live` | go-live API / webhook | `{ venueId, streamId }` | Browse, venue detail, live viewer |
| `stream:ended` | end API / webhook | `{ venueId, streamId }` | Browse, venue detail, live viewer, broadcast |
| `stream:viewers` | webhook (join/leave) | `{ venueId, streamId, currentViewerCount }` | Browse, live viewer, broadcast |
| `attendance:update` | Intent/arrival API | `{ venueId, streamId, intentCount, arrivalCount }` | Live viewer, broadcast, venue detail |
| `notification` | Various triggers | `{ type, title, body, data? }` | NavBar (web), notification handler (mobile) |

### 7.3 LiveKit Integration

**Server SDK:** `livekit-server-sdk` for room/token management.

| Operation | Method |
|-----------|--------|
| Create token | `createToken(identity, roomName, { canPublish, name })` — 6hr TTL |
| Delete room | `roomService.deleteRoom(roomName)` |
| Verify webhook | `webhookReceiver.receive(body, authHeader)` |

**Client SDKs:**
- **Web:** `@livekit/components-react` — LiveKitRoom, VideoTrack, RoomAudioRenderer, useTracks, useRemoteParticipants, useLocalParticipant, useChat
- **Mobile:** `@livekit/react-native` + `@livekit/react-native-webrtc` — same hooks plus AudioSession management

**Chat:** Uses LiveKit's built-in data channel chat via `useChat()` hook.

---

## 8. Authentication & Authorization

### 8.1 Roles

| Role | Capabilities |
|------|-------------|
| `VIEWER` | Browse, watch streams, track attendance, generate QR, submit feedback |
| `VENUE_PROMOTER` | All viewer + broadcast, view venue stats, scan QR |
| `VENUE_OWNER` | All promoter + create/edit venues, manage promoters, manage incentives |
| `ADMIN` | All owner + platform stats, manage all users/venues, end all streams, review feedback |

### 8.2 Registration Flows

**Viewer:** Email + password + display name + phone -> OTP verification -> full access

**Venue Owner:** Email + password + name + venue details -> user + venue created in transaction -> dashboard

**Promoter:** Email + password + name + invite code -> validates invite -> creates user + VenuePromoter link -> dashboard

### 8.3 Auth State Management

**Shared store** (`useAuthStore` in Zustand):
- Persisted to localStorage (web) or AsyncStorage (mobile) via `setAuthStorage()`
- Hydrated on app mount via `hydrate()` — restores user/token from storage
- `useRequireAuth()` hook prevents rendering protected content until hydration completes

**JWT:** HS256, 7-day expiry. Sent as `Authorization: Bearer {token}`.

### 8.4 Route Protection

| Platform | Mechanism |
|----------|-----------|
| Web | `useRequireAuth()` in layouts, role check in admin layout |
| Mobile | `useRequireAuth()` + role checks + `LiveAuthGate` for guest blocking |
| API | `requireAuth` middleware + `requireRole(...roles)` middleware |

---

## 9. Broadcast System

### 9.1 Lifecycle

```
1. Create Stream (POST /streams)
   └── IDLE status, LiveKit room name generated

2. Get Broadcaster Token (POST /streams/:id/token)
   └── LiveKit JWT with canPublish: true

3. Join LiveKit Room
   └── Client connects, publishes camera + mic

4. Go Live (POST /streams/:id/go-live OR track_published webhook)
   └── IDLE -> LIVE, notifications broadcast

5. Broadcasting
   ├── Viewers join via viewer tokens
   ├── Chat via LiveKit data channel
   ├── Viewer counts via webhooks (participant_joined/left)
   └── Attendance tracking via API + socket

6. End Stream (POST /streams/:id/end)
   └── LIVE -> ENDED, LiveKit room deleted, admin notified
```

### 9.2 Web Broadcast (`/dashboard/live/[venueId]`)

**Phases:** idle -> previewing (local camera) -> connecting -> live -> monitoring (owner watching) -> ended

**Components:** BroadcasterPreview, GoLiveOnPublish, ViewerCount, BroadcastChat, LiveControls

### 9.3 Mobile Broadcast (`/broadcast/[venueId]`)

**Phases:** setup -> connecting -> live

**Components:** BroadcastSetupScreen, BroadcasterPreview, GoLiveOnPublish, BroadcastRoom (with stats grid, timer, chat)

**Audio:** Platform-specific audio session config (Android: communication + speaker priority, iOS: speaker output)

### 9.4 Viewer Experience

**Web** (`/venues/[id]/live`): Fullscreen video + chat overlay + emoji reactions + attendance bar

**Mobile** (`/venues/[id]/live`): Same with native integrations — floating reaction animations (Reanimated), keyboard handling, QR modal, deep link support

---

## 10. Attendance & QR System

### 10.1 Two-Track Attendance

**Stream-level (anonymous):** `POST /attendance/intent` and `/arrival` — device-based, no auth required. Used for aggregate counts displayed on live streams.

**Venue-level (authenticated):** `POST /visits/intent` and `/arrival` — requires VIEWER role. Intent tracks "I'm coming", arrival generates single-use QR token.

### 10.2 QR Flow

```
1. Viewer taps "I've arrived" (requires auth + phone verified)
   └── POST /visits/arrival -> { qrToken, expiresAt, incentive? }

2. QR code displayed on viewer's phone
   └── Token stored in AsyncStorage (mobile) / shown in modal

3. Venue staff scans QR at door
   └── GET /visits/qr/:token (preview) -> validity, incentive info

4. Staff redeems QR
   └── POST /visits/qr/:token/redeem -> atomic single-use claim

5. QR expires after 4 hours or incentive expiry (whichever first)
```

### 10.3 Incentives

Venue owners can create active incentives (one per venue at a time). When a viewer generates an arrival QR, the active incentive is attached. Displayed during QR preview and redemption.

### 10.4 Dashboard Analytics

- **Visit stats:** coming/arrived/claimed counts per venue (`GET /venues/:id/visit-stats`)
- **Attendance summary:** Per-stream, per-day breakdown with date range filters (`GET /venues/:id/attendance-summary`)
- **Stream funnel:** Viewers -> saying coming -> arrived (shown in VenueStreamCard / StreamFunnelCard)

---

## 11. Landing Page

**Location:** `apps/landing/src/`  
**Framework:** Vite + React (standalone, no shared package dependency)

**Sections:** Hero with CTA form -> Feature marquee -> "What is it" -> 6 feature cards -> User testimonial -> "For Venues" -> Venue testimonial -> "How It Works" (3 steps) -> FAQ (5 items) -> Final CTA -> Footer

**Waitlist Capture:** Email + city + role (goer/venue/promoter) -> stored in localStorage (`vibecheck-waitlist-v2`)

**Design:** Black background, white text, red `#FF2D55` + lime `#BFFF00` accents, Bebas Neue / Source Serif 4 / IBM Plex Mono fonts, grain overlay effect, scroll-triggered blur navbar

**Target:** Late 2026 launch, South Africa (Cape Town/Joburg first)
