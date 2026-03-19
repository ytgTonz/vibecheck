# VibeCheck — Technical Overview

**Version:** 1.0.0
**Date:** 19 March 2026
**Prepared by:** Development Team
**For:** Technical Lead / CEO

---

## 1. What VibeCheck Is

VibeCheck is a venue discovery platform built for East London nightlife. It answers one question: **where should I go tonight?**

Instead of stale reviews or curated promo content, VibeCheck lets venue teams (owners and promoters) publish short video clips that show what the venue actually looks and feels like right now. Users browse a live-ranked feed, open venue stories, and make a decision based on current signal — not guesswork.

### Core Loop

```
Venue team uploads a short clip
    -> Clip appears on the venue's story feed
    -> Browse page ranks venues by activity (live > fresh > quiet)
    -> Users open stories, watch clips, decide where to go
```

### Target Users

| Role | What they do |
|------|-------------|
| **Venue Owner** | Registers a venue, uploads clips, manages promoters, views stats |
| **Venue Promoter** | Joins a venue via invite code, uploads clips on behalf of the venue |
| **Browser (public)** | Browses venues, watches clips, checks the vibe — no account needed |
| **Admin** | Platform moderation: manage users, venues, clips, view feedback |

---

## 2. Product Surface

### 2.1 Public Experience (no login required)

- **Landing page** — Product pitch, value props, CTAs to browse or sign in
- **Browse page** — Live-ranked venue directory with filtering by venue type and music genre. Venues are grouped into three sections:
  - **Live now** — clip uploaded within 2 hours
  - **Fresh tonight** — clip uploaded within 24 hours
  - **More venues** — older or no clips
- **Featured venue** — The most active venue is surfaced as a large hero card at the top
- **Venue detail** — Full venue profile with story viewer: featured clip, story rail, swipe/tap navigation, auto-advance, view tracking
- **Filtering** — Venue type pills (Nightclub, Bar, Restaurant & Bar, Lounge, Shisa Nyama, Rooftop, Other) + music genre dropdown

### 2.2 Authenticated Experience

- **Dashboard** — Overview of owned/linked venues with stats (total views, total clips, clips this week), recent clip management with deletion
- **Upload** — Clip upload flow: select video, tag venue, select genre, add caption. Web includes client-side video compression. Mobile supports camera recording or gallery pick
- **Venue editing** — Update venue name, type, location, hours, music genres, cover charge, drink prices
- **Promoter management** — Generate invite codes (7-day expiry), view linked promoters, remove promoters
- **Feedback** — In-app feedback form with category (Bug, Suggestion, General) and rating (Bad, Neutral, Good)

### 2.3 Admin Panel

- **Overview** — Platform-wide stats (user/venue/clip/feedback counts), users by role breakdown, recent activity
- **Feedback viewer** — Paginated list with category and rating filters
- **User management** — Paginated table with role badges, owned venue counts, deletion with cascade
- **Venue management** — Paginated table with owner info, clip/promoter counts, deletion with cascade
- **Clip management** — Grid view with thumbnails, stats, deletion with Cloudinary cleanup

---

## 3. Architecture

### 3.1 Monorepo Structure

```
vibecheck-app/
  apps/
    api/          Express REST API (Node.js)
    web/          Next.js 15 web application
    mobile/       Expo SDK 55 React Native app
  packages/
    shared/       Types, enums, API client, Zustand stores
```

The monorepo uses npm workspaces. The `shared` package is consumed by all three apps, ensuring type safety and logic reuse across web, mobile, and API.

### 3.2 System Diagram

```
                    [Browser / Next.js]
                           |
                     HTTPS (REST)
                           |
[Expo Mobile App] ----> [Express API] ----> [PostgreSQL]
                           |
                      [Cloudinary]
                     (video + thumbnails)
```

### 3.3 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **API** | Express.js | 5.1 |
| **Database** | PostgreSQL (via Prisma ORM) | Prisma 7.5 |
| **Auth** | JWT (jsonwebtoken) + bcrypt | — |
| **File storage** | Cloudinary (video upload + thumbnail generation) | — |
| **Web frontend** | Next.js (App Router) | 15 |
| **Mobile frontend** | Expo (React Native) | SDK 55 |
| **State management** | Zustand | 5.x |
| **Styling (web)** | Tailwind CSS | 4.x |
| **Styling (mobile)** | NativeWind (Tailwind for RN) | 4.x |
| **Video playback (mobile)** | expo-video | 55.x |
| **Language** | TypeScript | 5.9 |

### 3.4 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Monorepo with shared package | Single source of truth for types, API client, and stores across all platforms |
| Short clips, not live streaming | Dramatically simpler infrastructure, cheaper to serve, easier to moderate, still delivers the core value |
| Activity-based ranking over alphabetical | Surfaces venues with fresh content first — discovery over directory |
| Venue-first architecture | Clips belong to venues, not users — keeps the product focused on place discovery |
| JWT with 7-day expiry | Simple stateless auth appropriate for MVP scale |
| Cloudinary for video | Handles transcoding, thumbnail generation, and CDN delivery without custom infrastructure |
| Server-side ranking | API returns venues pre-sorted by activity tier so clients don't need to re-implement ranking logic |

---

## 4. Data Model

### 4.1 Entity Relationship

```
User (1) ---owns---> (N) Venue
User (N) <--promotes--> (N) Venue  [via VenuePromoter join table]
User (1) ---creates---> (N) Invite
User (1) ---submits---> (N) Feedback
Venue (1) ---has---> (N) Clip
Venue (1) ---has---> (N) Invite
```

### 4.2 Schema Summary

| Model | Key Fields | Notes |
|-------|-----------|-------|
| **User** | id, email, password (hashed), name, role | Roles: VENUE_OWNER, VENUE_PROMOTER, ADMIN |
| **Venue** | id, name, type, location, city, hours, musicGenre[], coverCharge, drinkPrices, ownerId | 7 venue types. City defaults to "East London, Eastern Cape" |
| **Clip** | id, videoUrl, thumbnail, duration, venueId, uploadedBy, caption, views | Views tracked via public endpoint |
| **VenuePromoter** | userId, venueId | Unique constraint on [userId, venueId] |
| **Invite** | code (unique), venueId, createdBy, used, expiresAt | 8-char random code, 7-day expiry |
| **Feedback** | category, rating, message, userId | Categories: BUG, SUGGESTION, GENERAL |

### 4.3 Venue Types

| Enum Value | Display Label |
|-----------|--------------|
| NIGHTCLUB | Nightclub |
| BAR | Bar |
| RESTAURANT_BAR | Restaurant & Bar |
| LOUNGE | Lounge |
| SHISA_NYAMA | Shisa Nyama |
| ROOFTOP | Rooftop |
| OTHER | Other |

---

## 5. API Surface

**Base URL:** Configured via environment variable. Default: `http://localhost:3001`

### 5.1 Public Endpoints (no authentication)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/venues` | List all venues, ranked by activity (live/fresh/quiet) |
| GET | `/venues/:id` | Single venue with latest clip metadata |
| GET | `/venues/:id/clips` | All clips for a venue, newest first |
| POST | `/clips/:id/view` | Increment clip view count |
| POST | `/auth/register` | Register as owner (with venue) or promoter (with invite code) |
| POST | `/auth/login` | Log in, receive JWT |

### 5.2 Authenticated Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| GET | `/venues/my/venues` | User's owned/promoted venues with stats | Any authenticated user |
| PATCH | `/venues/:id` | Update venue details | Venue owner only |
| POST | `/venues/:id/invite` | Generate promoter invite code | Venue owner only |
| GET | `/venues/:id/promoters` | List venue promoters | Venue owner only |
| DELETE | `/venues/:id/promoters/:userId` | Remove a promoter | Venue owner only |
| POST | `/clips` | Upload a clip (multipart/form-data) | Venue owner or promoter |
| DELETE | `/clips/:id` | Delete a clip | Venue member |
| POST | `/feedback` | Submit feedback | Any authenticated user |

### 5.3 Admin Endpoints (ADMIN role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform-wide statistics |
| GET | `/admin/feedback` | Paginated feedback with filters |
| GET | `/admin/users` | Paginated user list |
| DELETE | `/admin/users/:id` | Delete user with full cascade |
| GET | `/admin/venues` | Paginated venue list |
| DELETE | `/admin/venues/:id` | Delete venue with full cascade |
| GET | `/admin/clips` | Paginated clip list |
| DELETE | `/admin/clips/:id` | Delete clip with Cloudinary cleanup |

### 5.4 Venue Enrichment (GET /venues response)

Each venue in the listing includes derived fields from its latest clip:

```json
{
  "id": "...",
  "name": "Rumors Lounge",
  "type": "LOUNGE",
  "location": "Oxford Street, East London",
  "clipCount": 12,
  "lastClipAt": "2026-03-19T20:15:00.000Z",
  "latestClipThumbnail": "https://res.cloudinary.com/...",
  "latestClipCaption": "Floor is packed tonight",
  "latestClipViews": 47
}
```

Venues are sorted server-side into three tiers:
1. **Live** (lastClipAt < 2 hours) — sorted by recency, tie-break by clip count
2. **Fresh** (lastClipAt < 24 hours) — sorted by recency, tie-break by clip count
3. **Quiet** (lastClipAt > 24 hours or null) — sorted by recency, nulls last

---

## 6. Authentication & Authorization

### 6.1 Auth Flow

```
Register/Login -> Server returns JWT (7-day expiry) -> Client stores in localStorage
    -> Subsequent requests include Authorization: Bearer <token>
    -> Server middleware decodes JWT, attaches user to request
```

### 6.2 Role-Based Access

| Role | Capabilities |
|------|-------------|
| VENUE_OWNER | Full control of owned venues: edit details, upload clips, manage promoters, generate invites, view stats |
| VENUE_PROMOTER | Upload clips to linked venues, view stats for linked venues, delete own clips |
| ADMIN | Full platform access: view all data, delete any user/venue/clip, view feedback |

### 6.3 Venue-Level Authorization

Beyond roles, certain actions check venue membership:
- **Upload a clip** — user must be the venue owner OR a linked promoter
- **Delete a clip** — user must be a member of the clip's venue
- **Edit venue / manage promoters** — user must be the venue owner

---

## 7. Platform Coverage

### 7.1 Feature Matrix

| Feature | Web | Mobile |
|---------|-----|--------|
| Landing page | Yes | — |
| Browse with filtering | Yes | Yes |
| Activity-ranked sections | Yes | Yes |
| Featured venue card | Yes | Yes |
| Venue detail page | Yes | Yes |
| Story viewer (swipe navigation) | Yes | Yes |
| View count tracking | Yes | Yes |
| Registration (owner + promoter) | Yes | — |
| Login | Yes | Yes |
| Clip upload | Yes | Yes |
| Camera recording | — | Yes |
| Client-side video compression | Yes | — |
| Dashboard with stats | Yes | Yes |
| Venue editing | Yes | — |
| Promoter management | Yes | — |
| Invite code generation | Yes | — |
| Feedback submission | Yes | — |
| Admin panel | Yes | — |
| Pull-to-refresh | — | Yes |

### 7.2 Web-Specific Notes

- Landing page serves as the product pitch and entry point
- NavBar adapts based on auth state (shows Dashboard/Upload when logged in, Admin link for admins)
- Video player supports both mouse and keyboard controls (arrow keys, space, escape)
- Client-side video compression before upload reduces bandwidth

### 7.3 Mobile-Specific Notes

- Built with Expo SDK 55 and expo-router for file-based routing
- 4-tab navigation: Browse, Upload, Dashboard, (hidden Venue detail)
- Story viewer uses native gesture system (PanResponder) for swipe navigation
- Camera recording for direct clip capture
- Pull-to-refresh on Browse, Venue Detail, and Dashboard screens
- Dev build configured via EAS Build (Android package: `com.ytgtonz.vibecheck`)

---

## 8. Infrastructure & Deployment

### 8.1 Current Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | API | PostgreSQL connection string |
| `JWT_SECRET` | API | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | API | Cloudinary account name |
| `CLOUDINARY_API_KEY` | API | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | API | Cloudinary API secret |
| `PORT` | API | Server port (default: 3001) |
| `NEXT_PUBLIC_API_URL` | Web | API endpoint for browser |
| `EXPO_PUBLIC_API_URL` | Mobile | API endpoint for mobile app |

### 8.2 Deployment Readiness

| Component | Status | Notes |
|-----------|--------|-------|
| API | Ready | Heroku postbuild script configured. Express on configurable PORT |
| Database | Ready | Prisma migrations, PostgreSQL |
| Web | Ready | Next.js production build passes cleanly |
| Mobile (Android) | In progress | EAS Build configured, dev build pipeline set up, APK generated |
| Mobile (iOS) | Not started | Requires Apple Developer account |

### 8.3 External Service Dependencies

| Service | Purpose | Pricing Model |
|---------|---------|--------------|
| PostgreSQL (hosted) | Primary database | Per-plan (Heroku, Supabase, Neon, etc.) |
| Cloudinary | Video storage, transcoding, thumbnails, CDN | Free tier: 25 credits/month. Paid plans scale with usage |
| EAS Build | Mobile app builds | Free tier: limited builds/month. Paid for priority |

---

## 9. What Has Been Built (Completion Summary)

### Completed Milestones

| Week | Milestone | Scope |
|------|-----------|-------|
| 1-2 | Foundation | Monorepo setup, Prisma schema, Express API, basic venue CRUD, auth system |
| 3 | Venue Detail + Clip Playback | Venue detail pages, story viewer with swipe navigation, clip view tracking |
| 4 | Promoter Upload Flow | Clip upload (web + mobile), video compression, invite code system, promoter linking |
| 5 | Auth, Dashboard, Polish | Auth restructure, dashboard with stats, venue editing, feedback system, admin panel, responsive UI, mobile parity |
| 6 | Discovery & Browsing | Activity-based ranking, sectioned browse layout, featured venue cards, thumbnail backgrounds, filter pills, pull-to-refresh |

### Code Metrics

| Metric | Count |
|--------|-------|
| API endpoints | 20 |
| Database models | 6 |
| Web pages/routes | 12 |
| Mobile screens | 5 |
| Shared types/interfaces | 15 |
| Shared API client functions | 22 |

---

## 10. What Comes Next

### 10.1 Near-Term (recommended for v1.1)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Mobile registration flow | Low | High | Currently login-only on mobile. Registration with venue creation and invite code support |
| Push notifications | Medium | High | "Venue X just dropped a clip" — drives return visits |
| Quick drops (rapid 15s clips) | Low | Medium | Near-live feel without streaming infrastructure. Special "Dropping now" badge for clips < 5 min old |
| Venue search | Low | Medium | Text search by name or location |
| Venue following | Medium | Medium | Users can follow venues and get notified of new clips |

### 10.2 Medium-Term (v1.2+)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Location-based discovery | Medium | High | Sort/filter by proximity using device GPS |
| Analytics dashboard | Medium | Medium | Richer stats: views over time, peak hours, audience retention |
| Clip reactions (fire, meh, dead) | Low | Medium | Quick sentiment signal from viewers |
| Venue verification badges | Low | Low | Trust signal for established venues |
| iOS production build | Medium | High | Requires Apple Developer Program enrollment ($99/yr) |

### 10.3 Long-Term (v2.0)

| Feature | Effort | Impact | Notes |
|---------|--------|--------|-------|
| Live streaming | Very High | High | Requires media server infrastructure (Mux/AWS IVS). See detailed analysis below |
| Multi-city expansion | Medium | High | Remove East London default, add city selection |
| Monetization (promoted venues) | High | High | Paid placement in featured slot or boosted ranking |
| Event integration | Medium | Medium | Link clips to specific events (DJ sets, specials, launches) |

### 10.4 Live Streaming — Detailed Assessment

Live streaming was evaluated and **deferred** from the MVP. Key reasons:

1. **Infrastructure complexity** — Requires real-time video ingest, transcoding, and low-latency distribution. Self-hosting is unrealistic at this stage; third-party services (Mux Live, AWS IVS) add significant recurring cost
2. **The current model works** — Short clips already answer "where should I go?" A 20-minute-old clip tells you the vibe just as well as a live stream
3. **Cost** — Third-party live services charge ~$0.025/min broadcast + ~$0.005/min per viewer. At scale this becomes a significant line item
4. **Moderation** — Live content cannot be pre-screened, creating legal and safety risks that don't exist with uploaded clips

**Recommended alternative:** The "Quick Drops" feature (rapid 15s clips with a "Dropping now" badge) delivers 90% of the live feel at 5% of the engineering cost, using existing upload infrastructure.

---

## 11. Risks & Considerations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Cloudinary free tier limits | Medium | Monitor usage. Upgrade plan or migrate to S3 + FFmpeg when volume justifies it |
| JWT token in localStorage | Low (for MVP) | Acceptable for MVP. Consider httpOnly cookies or refresh token rotation for production hardening |
| No rate limiting on public endpoints | Medium | Add express-rate-limit before launch to prevent abuse of view counting and venue listing |
| No email verification | Low | Users can register with any email. Add verification flow before scaling |
| Single-region database | Low | Adequate for East London user base. Consider read replicas if expanding to multiple cities |

---

## 12. How to Run Locally

```bash
# Clone and install
git clone <repo-url>
cd vibecheck-app
npm install

# Set up environment
cp apps/api/.env.example apps/api/.env
# Fill in: DATABASE_URL, JWT_SECRET, CLOUDINARY_*

# Run database migrations
cd apps/api && npx prisma migrate dev

# Start API
npm --workspace @vibecheck/api run dev

# Start web (separate terminal)
cd apps/web && npm run dev

# Start mobile (separate terminal)
cd apps/mobile && npx expo start --dev-client
```

---

*Tagged as v1.0.0 on 19 March 2026. Commit: `0043e9e`.*
