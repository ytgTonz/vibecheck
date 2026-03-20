# LiveKit v1.2.0 Plan Concerns

## Status
The plan is broadly implementation-ready. The main structural issues were already corrected:
- scope reduced to web-first
- mobile broadcasting deferred
- server/client LiveKit env vars split
- broadcaster token route clarified
- DB unique index limited to `LIVE`

## Remaining Concerns

### 1. `IDLE` stream handling still needs concrete implementation
The plan says stale `IDLE` streams can be cleaned by age, but this needs to exist in code, not just prose.

Risk:
- manager starts stream creation
- browser closes before actual publish/connect
- stream remains `IDLE`
- route-level checks may keep blocking later attempts

Recommended implementation:
- before creating a new stream, mark stale `IDLE` rows older than a threshold as `ENDED`
- suggested threshold: `1 hour`

### 2. Route checks vs DB guarantee should be described precisely
The partial unique index only guarantees:
- one `LIVE` stream per venue

It does **not** guarantee:
- one `IDLE` stream per venue

So the real behavior should be documented as:
- route checks guard against existing `IDLE` or `LIVE`
- DB is the final authority only for `LIVE`

This matters because concurrent `POST /streams` requests can still create multiple `IDLE` rows.

### 3. Concurrent `IDLE` rows are still possible
Because the DB index excludes `IDLE`, two near-simultaneous create requests can both succeed as `IDLE`.

That is acceptable only if the lifecycle is handled intentionally:
- only one stream transitions to `LIVE`
- stale or losing `IDLE` rows are ended/ignored cleanly

If not handled, the system may accumulate abandoned sessions.

### 4. Viewer token error contract should be explicit
The plan says viewer tokens are only issued for `LIVE` streams. The API should define the failure mode clearly.

Recommended behavior:
- `GET /streams/:id/viewer-token` on `IDLE` or `ENDED` stream returns a clean app-level error
- prefer `409` with a message like `Stream is not live`

### 5. Mobile watch should remain stretch, not hard release criteria
The plan already frames Phase 7 as stretch. That should stay true in implementation and release expectations.

Practical release bar for `v1.2.0`:
- backend stream lifecycle works
- web broadcast works
- web watch works
- venue discovery reflects live state

Mobile watch is useful, but should not block shipping if web is stable and time runs out.

## Recommendation
Proceed with implementation, but lock in these rules first:
1. stale `IDLE` cleanup happens in code
2. documentation distinguishes route checks from DB guarantees
3. viewer-token failure behavior is explicit
4. mobile watch remains optional for `v1.2.0`
