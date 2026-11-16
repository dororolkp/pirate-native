# Gazebo Cooperation and Modular Monolith

## Verified Source

Reference: https://github.com/painpongpoint/Gazebo-Simulator at commit `b0f69479b645dea097dc55b9c023f237986e7817`.

The repository supplies a Python/Tk control panel and Gazebo transport, not REST, WebSocket, ROS, authentication, camera streaming, or a deployable web backend. Requirements are Ubuntu 24.04 (or its WSL distribution), Gazebo Harmonic / Sim 8, transport13, msgs10 and python3-tk. Its included hatchback uses physical collision shapes and Ackermann steering.

| Source setting | Value |
| --- | --- |
| World / model | `shapes` / `hatchback_blue` |
| Velocity topic | `/model/hatchback_blue/cmd_vel` (`Twist`) |
| Pose topic | `/world/shapes/pose/info` (`Pose_V`) |
| Wheelbase | 2.5165 meters |
| Steering limit | +/-0.45 radians |
| Requested speed | 0.2 to 2.0 m/s |
| Source command cadence | 50 ms |

`linear.x = requested signed speed`; `angular.z = speed * tan(steering) / 2.5165`. Steering is not sideways movement. Turning requires motion; stopping has a braking distance.

## Current Behavior

Robots contains a Gazebo driving lab that **only computes local previews**. It does not publish to Gazebo, move the car, poll an endpoint or open a socket. Its Connect button is disabled. The colorful car/lane/obstacle scene is a vector concept diagram, not a simulator screenshot, camera feed or live pose.

Choose speed, hold a direction, release to clear. Web arrows are opt-in; Space/Escape, focus loss, visibility changes, and app backgrounding clear previews. Single button activation clears immediately. The preview supports forward, reverse, forward-left and forward-right arcs, not simultaneous reverse steering or physical dynamics.

Atlas missions are still the independent warehouse demonstration. Their 800 x 390 application coordinates are **not Gazebo meters**. Do not map them directly or claim they control the hatchback.

## Proposed Gateway, Not an Existing API

`src/lib/gazebo-contract.ts` owns Zod DTO validation, verified constants, velocity conversion and the `GazeboGateway` interface. There is no gateway implementation or active integration configuration yet.

Agree these proposed endpoints with the backend owner before implementing:

| Proposed endpoint | Responsibility |
| --- | --- |
| `GET /api/v1/simulator/status` | World/model, connectivity and capabilities |
| `GET /api/v1/simulator/telemetry` | Validated pose, world frame, meters, authoritative timestamp |
| `POST /api/v1/simulator/control/lease` | Authenticated exclusive operator lease |
| `POST /api/v1/simulator/control/commands` | Leased, sequenced velocity command and acknowledgment |
| `DELETE /api/v1/simulator/control/lease` | Revoke lease and request zero velocity |

Example command DTO (future lease sent separately using an authenticated session):

```json
{
  "model": "hatchback_blue",
  "linear_x": 1,
  "angular_z": 0.191946,
  "lease_ms": 250,
  "sequence": 1
}
```

Telemetry schema:

```json
{
  "model": "hatchback_blue",
  "world": "shapes",
  "frame": "world",
  "unit": "meters",
  "observed_at": "2026-11-16T12:00:00Z",
  "connected": true,
  "pose": { "x": 0, "y": 0, "yaw": 0 }
}
```

The gateway must derive/validate yaw, reject invalid/future/stale telemetry, bound angular velocity consistently with speed and steering, enforce exclusive ownership and monotonically increasing sequences, reject replay, and zero velocity after lease expiration. The proposed 250 ms lease is a design starting point, not a tested safety guarantee. Backend authorization, session expiry, server-side deadman behavior, acknowledgments and audit logs are mandatory before enabling controls. Never automatically retry movement commands. Keep mission and manual control mutually exclusive.

Only the backend translates validated DTOs into Gazebo transport. Do not expose Gazebo transport directly to a browser, bundle credentials, or depend on frontend blur/unmount for stopping. Coordinate transforms and autonomous mission navigation require additional contracts that the source does not provide.

## Monolith First

One repository, one Expo application, one release unit, and no newly created backend services:

- Routes: `src/app/` only composes screens and the root provider.
- Fleet domain/persistence/transport: existing `src/lib/fleet-*` and `use-fleet.tsx`.
- Simulator domain: `gazebo-contract.ts`, independent of React, DOM, network and fleet map coordinates.
- Simulator UI: `gazebo-driving-lab.tsx` owns ephemeral preview state, not robot truth.
- Visual presentation: `simulation-hero.tsx`, `gazebo-scene.tsx` and shared `ui.tsx` design tokens.
- Guidance: `ariel-assistant.tsx`, curated local answers, not a remote AI or control agent.
- Web infrastructure: `web-presence.web.tsx`, isolated from native by `.tsx` no-op implementations.
- Tests: domain conversion/schema tests plus browser idle/keyboard/metadata/privacy tests.

Components depend on domain contracts, not the reverse. Add the real gateway inside this codebase when its contract is approved. Extract a service only when measured operational needs warrant it. Do not introduce microservices or duplicate domain models solely for organization.

## SEO, Analytics and Accessibility

Web uses Expo Router **static output** with per-route title, description, canonical, Open Graph/Twitter metadata, English document language, robots rules and sitemap. Static HTML contains public introduction content; private local fleet records hydrate only in the browser. Settings is noindex. Vercel uses clean URLs, not the old SPA rewrite. Metadata URLs are pinned to the production domain; update them and the sitemap when changing domains. Submit `/sitemap.xml` in Search Console after deployment. Ranking and indexing are not guaranteed.

SDK 58 route exports use `generateMetadata()` for initial HTML and `Head` for client navigation updates. Custom HTML renders `useServerDocumentContext()` head/body nodes so styles and hydration scripts are retained. Responsive web layouts use a hydration-stable initial viewport. Social cards use text summaries; no unavailable or placeholder social image is published. The image-generation service returned a placeholder during QA, so the delivered scene uses a purpose-built SVG diagram and makes no external image requests.

For Google Analytics:

1. Create a GA4 web data stream for the production site.
2. Disable **all Enhanced Measurement** in that stream to avoid automatic interactions, search terms or unsanitized URLs outside our fixed-route page events.
3. Set `EXPO_PUBLIC_GA_MEASUREMENT_ID=G-YOURREALID` in local/deployment build settings.
4. Rebuild. Open Settings -> Privacy & analytics -> Allow optional page analytics.
5. Validate allowed page events in GA DebugView/Realtime and inspect network requests.
6. Select Keep analytics off to disable further tracking. Clear site cookies/storage to remove existing GA identifiers; opting out cannot erase already processed Google data.

No Google script/request is initiated before explicit opt-in. Advertising consent is denied; no commands, robot telemetry, mission IDs, user IDs or Ariel questions are intentionally tracked. Google still receives browser/device information after consent, so this is not a claim of full anonymity. Existing code assumes Enhanced Measurement stays disabled. No actual measurement ID was supplied; analytics collection is unconfigured until the owner sets one. Native analytics is intentionally absent.

Native semantics and web ARIA include labeled controls, selected/disabled states, live status, modal semantics, image descriptions, >=44-unit touch targets, visible keyboard focus and reduced-motion CSS. Keyboard preview capture is opt-in and skips input fields. This is implementation support, not a certified WCAG audit; physical device and screen-reader testing remain required.

## Acceptance Before Enabling Backend

Use `npm run check`, `npm run test:e2e`, and `npm run build:bundles`. Then review authentication, lease expiry, stale data, disconnect, simultaneous users, frame conversion, command rejection/acknowledgment and simulator collision behavior with the backend owner. Real robot controls and physical emergency stopping are outside the current delivery.
