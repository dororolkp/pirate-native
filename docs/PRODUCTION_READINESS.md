# Production Readiness and Architecture

## Scope and Honest Status

This upgrade improves the shared web/iOS/Android client. It does **not** start a Gazebo gateway, create authentication, apply a production database migration, certify robot stopping, or publish native binaries. Gazebo stays idle and its Connect button stays disabled. The existing fleet HTTP adapter is used only when an API base is explicitly configured.

The database migration is a tested backend design artifact, not a database running inside the app. GA4 requires the owner's real measurement ID and opt-in. No analytics account or reporting dashboard has been provisioned automatically.

## Modular Monolith

One application, one repository and one release unit remain the default. Module boundaries are implemented with imports and interfaces instead of new services:

| Module                                              | Responsibility                                                  | Boundary                                          |
| --------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `src/app`                                           | Route composition and static metadata                           | No domain/service implementation                  |
| `fleet-domain`, `demo-simulator`, `gazebo-contract` | State rules and deterministic simulation                        | No DOM or tracking calls                          |
| `fleet-service`                                     | Fleet service implementations, hydration and polling            | Implements `FleetService`                         |
| `network`                                           | One bounded HTTP request, cancellation and error classification | No mutation retries                               |
| `use-fleet`                                         | Shared controller, command guard and AppState lifecycle         | One provider across routes                        |
| `activity-store`, `use-logbook`                     | Bounded local diagnostic journal                                | Fixed codes only, no raw robot payload            |
| Components                                          | Task-oriented UX and accessible controls                        | Native primitives and shared design tokens        |
| `analytics.web`, `web-presence.web`, `+html`        | Optional web tracking and search metadata                       | Native implementations do not load Google scripts |
| `backend/schema`                                    | Future server-side persistence design                           | Not imported or executed by the client            |

Patterns in use: service ports/adapters, a shared application controller, a small observer-based external store, platform-specific infrastructure, schema validation at transport/storage boundaries, and database-enforced invariants. Do not introduce microservices until ownership, scaling or operational requirements justify an independently deployed boundary.

## UX and Content

- Six destinations: Overview, Robots, Missions, Analytics, Logbook and Settings.
- Overview introduces the workspace with a compact violet concept diagram; Robots prioritizes operational tools instead of repeating a large hero.
- Operations status communicates transport failure, disconnection, staleness and manual mode before the user dispatches.
- Status is derived from telemetry, not decorative uptime, fabricated trends or a fake authenticated avatar.
- Keyboard users can skip navigation to the main workspace. Headings have explicit levels, focus is visible, and reduced-motion preferences are respected.
- Minimum 44-unit touch controls, responsive panels, bounded/paginated histories and accessible text accompany maps/charts.
- Ariel remains curated local guidance, not a cloud AI assistant.

This is not a claim of certified WCAG conformance. VoiceOver/TalkBack and actual device testing remain release requirements.

## Network and Performance

Healthy live reads poll every two seconds. Consecutive failed reads back off to 4, 8, 16 and 30 seconds. A valid `Retry-After` can extend the delay up to 60 seconds. Manual refresh bypasses the scheduling delay but still coalesces with an in-flight read. Successful reads restore the normal interval.

HTTP requests have an eight-second deadline. Invalid API URLs with credentials, query strings or fragments are rejected. Request headers are preserved and responses remain schema-validated. Unsubscription aborts outstanding requests; live polling pauses in background/inactive AppState and resumes on foreground.

There are **no automatic POST retries**. An ambiguous task-creation result retains the session lock; accepted IDs are retained before telemetry refresh; live cancel requires a backend status acknowledgment. Do not remove these rules merely to make a button look responsive.

Demo UI ticks remain at 500 ms. Routine heartbeat/progress persistence is throttled to five seconds; explicit commands still save immediately through the ordered write queue. A reload can recompute active demo progress from wall-clock time. A crash can lose the latest routine progress/events; this is not a physical motion guarantee.

Static diagram/hero components are memoized, mission filtering is memoized, and histories render bounded pages. These are targeted optimizations, not claimed benchmark improvements. Profile a real device before adding broad caches, virtualization or concurrent background work.

## Local Logbook

Storage key: `pirate-local-activity-v1`.

Records include a local random ID, timestamp, fixed event code, mode (`demo`/`live`) and outcome (`ok`/`failed`/`info`). No free-text messages, destinations, robot poses, mission identifiers, credentials, API response bodies or assistant questions are accepted.

Requests and observed mission state transitions are different events. A successful cancellation **request** does not prove the robot stopped. Initial seeded missions are not copied into the operational journal.

- At most 200 records, with seven-day retention checked on load/add/save.
- Stored with AsyncStorage on the device/browser, not uploaded.
- Search, outcome filters, ten-row pages, CSV export and confirmed clear.
- Disabling local recording also clears its saved history.
- Storage failure is visible and does not block robot/demo commands.

This local journal is not encrypted storage, tamper-proof, synchronized, or a compliance audit trail. Other users on a shared browser/device may see it. Use the off/clear controls for shared-device privacy; authoritative audit logging must be implemented by an authenticated backend.

## Google Analytics and Tracking

Set `EXPO_PUBLIC_GA_MEASUREMENT_ID=G-...` using your actual GA4 property. Rebuild afterward. Keep GA Enhanced Measurement disabled, particularly automatic page views, form and outbound-link capture.

Google scripts load only after explicit consent in Settings. Native builds never load them. Page views are restricted to `/`, `/robots`, `/missions` and `/analytics`; Settings, Logbook and unknown routes are excluded. URLs omit query strings and page referrers.

Allowed UI events:

| Event                      | Meaning                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `help_opened`              | User opens public-workspace guidance                                  |
| `mission_history_exported` | Public mission-export interaction, without record contents/counts/IDs |
| `chart_style_changed`      | Public chart-style interaction                                        |

The tracking API accepts only these event names and no arbitrary payload parameter. Controls, drive previews, logbook entries and assistant questions are not sent. Opt-out sets Google's disable flag, removes the loader and attempts to clear Google cookies on the current host. Previously delivered Google data cannot be recalled. Google can process browser/device/IP data after opt-in; approve privacy disclosures and retention settings before enabling it.

## SEO and Hosting

Static route HTML contains page titles, descriptions, canonical URLs and Open Graph/Twitter metadata. JSON-LD identifies the software accurately without invented ratings or a claim that robot control is live. Settings and Logbook use `noindex, follow` and are absent from the sitemap.

`noindex` is not access control: static routes are public, while operational state loads locally. A future authenticated backend must enforce workspace access independently.

Vercel config includes no-sniff, frame denial, a restrictive camera/microphone/geolocation permissions policy, revalidated HTML and long-lived cache headers for hashed Expo bundles. Browser mixed-content rules still prevent an HTTPS site from calling a plain HTTP gateway.

The canonical production domain is currently fixed to `pirate-native.vercel.app`. If it changes, update metadata, analytics canonicalization, robots and sitemap together. Search ranking, rich results and indexing are not guaranteed.

## SQL Readiness

`backend/schema/001_workspace.sql` targets SQLite with STRICT tables, foreign keys and transactionally applied schema version 1. Tests run it using Node 24's `node:sqlite` against an in-memory database. Node currently labels this API experimental; the application does not import it.

The schema covers workspaces, robots, missions, command requests and operational events. Composite foreign keys enforce tenant/robot boundaries. A partial unique index allows only one queued/running mission per robot. Checks enforce valid progress, terminal timestamps, command expiry ordering and valid event JSON. Unique idempotency keys plus a payload hash support future server reconciliation.

For a future gateway:

1. Apply migrations once, in order, with backups and transactional rollback on error.
2. Use prepared statements and workspace IDs derived from verified authentication, never a trusted client parameter.
3. Keep SQLite on a persistent local volume. Do not put it in Vercel static output or an ephemeral function filesystem. Consider PostgreSQL only when multiple writers/instances require it.
4. Enable WAL and an appropriate busy timeout on a file-backed database; monitor write contention.
5. Keep transactions short. Do not hold a DB transaction open while awaiting Gazebo/robot I/O.
6. Persist command acceptance atomically, compare idempotency payload hashes and expose reconciliation/current-task endpoints.
7. Use revision-checked updates and keyset pagination. Expire sensitive/diagnostic data according to an approved retention policy.
8. Add authenticated authoritative events, backups, restore drills and operational alerts before calling it a production backend.

Example optimistic update:

```sql
UPDATE missions
SET progress = ?, updated_at = ?, revision = revision + 1
WHERE workspace_id = ? AND task_id = ? AND revision = ?;
-- Zero affected rows means reload/reconcile, not overwrite.
```

Example history page (cursor is the previous page's final timestamp/ID):

```sql
SELECT task_id, status, created_at
FROM missions
WHERE workspace_id = ?
  AND (created_at < ? OR (created_at = ? AND task_id < ?))
ORDER BY created_at DESC, task_id DESC
LIMIT ?;
```

No SQL query or migration is invoked by pressing a UI control today.

## Verification and Release Gate

```powershell
npm run test:hooks
npm run test:sql
npm run check
npm run test:e2e
npm run build:bundles
npx expo-doctor
npm audit
```

Tests cover network timeout/cancellation/backoff, mutation safety, persistence budgets, logbook validation/privacy/retention, hook cleanup/hydration, SQL constraints/index use, static metadata and analytics allowlists. Browser tests verify logbook workflows, keyboard access and unchanged idle Gazebo behavior.

Still required before real robot control: approved API contracts, authentication/authorization, current-task discovery, command reconciliation/idempotency, control leases, robot-side deadman/protective stopping, trusted coordinate frames, native device testing and a signed release. These are operational and safety requirements, not merely styling tasks.
