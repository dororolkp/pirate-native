# Pirate Site and Application Specification

## Product Purpose

Pirate is a single-robot warehouse mission workspace. An operator dispatches Atlas between receiving Station A and dispatch Station B, watches pose and task state, cancels work, inspects timestamped records and evaluates mission performance.

This React Native edition recreates the original Next.js application's product workflows. It is a new native-component implementation, not an iframe, WebView wrapper, copied Next.js runtime, or pixel-perfect desktop screenshot. Mobile controls and navigation are adapted for touch.

Reference: `startup project/pirate` at `d5b4f30`, with original domain, simulator, adapter, dashboard, map, mission ledger and analytics reviewed before implementation.

## Platforms and Scope

| Target  | Runtime/build                                     | Layout                                         |
| ------- | ------------------------------------------------- | ---------------------------------------------- |
| Web     | Expo Router SPA, React Native Web, static `dist/` | Desktop sidebar or responsive mobile tabs      |
| iOS     | React Native, Expo modules, Hermes                | Safe-area-aware native views, touch navigation |
| Android | React Native, Expo modules, Hermes                | Safe-area-aware native views, touch navigation |

One configured robot is supported. No authentication, real fleet reservation, multi-robot traffic management, backend database, ROS/Gazebo runtime, push notifications, continuous background tracking or live joystick teleoperation is included.

## Routes

| Route        | Screen    | Responsibility                                                                                                 |
| ------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| `/`          | Overview  | Metrics, map, command center, activity chart, performance, recent records and events                           |
| `/robots`    | Robots    | Map, robot status, dispatch/cancel, demo stop/manual steps and event timeline                                  |
| `/missions`  | Missions  | Search, filters, pagination, details, CSV, timestamps and task events                                          |
| `/analytics` | Analytics | Reporting period, timestamp-derived chart and mission performance                                              |
| `/settings`  | Settings  | Mode/API configuration display, retry telemetry, scenarios, connection simulation, reset and integration notes |

Direct web URLs and reloads use the hosting SPA fallback. Native deep links use the `pirate-native` scheme, for example `pirate-native://robots`. Normal navigation stays inside one FleetProvider so changing routes does not reset active work.

## Shared Workspace

- Brand: `pirate.` with orange anchor mark and BETA label.
- Demo workspace: Acme Warehouse / Warehouse 01.
- Demo operator: Felix. This is not an authenticated administrator or authorization claim.
- Navigation: desktop sidebar at widths >=1050; otherwise five bottom destinations.
- Header: current workspace/screen, explicit SIMULATION or LIVE API badge, notifications and help.
- Content: scrollable operational workspace with fixed navigation outside the scroll container.
- Global notices: command outcome/errors, storage warnings and connection failures.
- Help: in-app walkthrough explaining simulation, safety and primary controls.
- Notifications: latest timestamped fleet events, not OS push notifications.

## Visual System

| Token             | Value                                      |
| ----------------- | ------------------------------------------ |
| Background        | `#f8f9fb`                                  |
| Surface           | `#ffffff`                                  |
| Primary text      | `#253246`                                  |
| Secondary text    | `#697688`                                  |
| Border            | `#e8ebef`                                  |
| Primary orange    | `#e87b42`                                  |
| Orange background | `#fff1e7`                                  |
| Success           | `#397558`, soft `#e9f3ec`                  |
| Error             | `#b44c48`                                  |
| Card radius       | 11-12 map/native units                     |
| Button radius     | 8                                          |
| Touch controls    | Minimum 44 high; mobile navigation 56 high |

System fonts avoid font downloads. Headings use bold slate type with an orange punctuation accent. Panels use thin borders and white surfaces. Metrics use large values, subdued context labels and lightweight icons.

Desktop content uses two-column map/command and analytics/performance rows at widths >=1250. Narrower screens stack these panels. Metric cards wrap into two columns on phones. Ledger rows collapse into touch-friendly wrapped cards rather than forcing a horizontal desktop table.

Maps/charts are `react-native-svg` vector elements; UI icons are Lucide React Native. App icons and favicon are rasterized from the local vector brand generator. No external photo resources or placeholder illustrations are needed.

## Overview Requirements

- Heading: Fleet overview.
- A visible safe-demo banner explains that all demo telemetry/history is simulated.
- Reporting period: All time, Today (local calendar midnight), Last 7 days (rolling).
- Metrics: total missions, online robot count, completed missions and success rate.
- Online is determined from connected state, fresh robot-origin heartbeat and transport health.
- A warehouse map, command center, mission activity chart, performance panel, five-row recent ledger and event timeline share the same state.
- New mission opens a destination confirmation, defaulting to the opposite dock when Atlas is at Station B.

## Warehouse Map Requirements

- Frame: 800 x 390 application map units.
- Station A: `(140,220)` / Receiving dock.
- Station B: `(660,220)` / Dispatch dock.
- Warehouse boundary, central corridor, two shelf rows and four labeled aisles.
- Orange robot marker with heading indicator, halo, name and live position.
- Active mission route from recorded origin to selected dock.
- Obstacle marker when the obstacle scenario is selected.
- Zoom controls from 1x to 2x, centered on map center; Center resets to 1x.
- Toggle map/station labels.
- Visible position/yaw and fresh/offline telemetry summary.
- Accessible map description includes robot pose and destination.

Map values are not physical meters. Robot adapters must convert physical coordinates into the agreed application frame; frontend map pixels must never be sent directly to Nav2 as world coordinates.

## Robot Command Requirements

- Atlas identity, robot ID, status, connection and battery percentage.
- Dispatch to A/B only when connected, fresh, idle, autonomous, transport healthy and no command pending.
- Only one local active task. Backend exclusivity across multiple clients remains mandatory.
- Active task: ID, queued/running status, progress and cancellation.
- Demo cancel immediately acknowledges a stopped simulator task.
- Live cancel remains active until backend task status explicitly reports canceled.
- Demo Stop simulation cancels active work and clears manual mode.
- Demo manual mode only on an online idle robot; four buttons move by 12 map units, bounded to x=110..690, y=195..245.
- Manual mode blocks autonomous dispatch and clears on reload/backgrounding.
- No live velocity/joystick controls are exposed.

## Mission Ledger Requirements

- Match search against task ID, robot ID, readable destination and status.
- Filters: all, queued, running, completed, failed, canceled.
- Page sizes: five on Overview; eight on Missions.
- Display empty-state guidance when search/filter matches no records.
- Detail modal: IDs, destination, progress, status, created/started/updated/finished timestamps, duration, readable error and task-specific events.
- Export all matching records, not just the current page.
- Web CSV downloads; iOS/Android CSV opens the share sheet.
- Quote fields and escape quotes; prefix formula-like values to reduce spreadsheet injection risk.
- Web demo storage and native demo storage are local, not synced across devices.

## Analytics Requirements

- Hourly buckets: last 8 hours, 24 hours or 168 hours (7 days).
- Current bucket is the current local clock hour; previous buckets begin at local hour boundaries.
- Bar view separates completed vs other outcomes. Line view plots all activity.
- Chart summary totals come from the same buckets as the plot.
- Success rate = completed / (completed + failed + canceled), rounded to nearest percent.
- Queued/running tasks are excluded from the success denominator.
- Average delivery duration uses completed tasks with started and finished timestamps.
- Empty history yields zero metrics, not an invented rate or trend.
- Shared reporting filters constrain the mission data entering analytics.

## Simulation State Model

```text
queued -> running -> completed
queued/running -> canceled
queued/running -> failed
```

| Scenario   | Timing and Result                                                                |
| ---------- | -------------------------------------------------------------------------------- |
| Normal     | One-second queue, 18 seconds travel, completes around 19 seconds                 |
| Obstacle   | Pause between motion seconds 6 and 10, then recover; completes around 23 seconds |
| Timeout    | Progress capped at 55%; fails after 15 seconds total                             |
| Disconnect | Active mission fails; pose stops; controls disable                               |
| Reconnect  | Heartbeat updates; failed task never resumes                                     |
| Stop       | Active work canceled; manual cleared; no future motion for canceled work         |
| Reset      | Confirmation required; clears local state and restores 24 samples                |

Simulation ticks every 500ms. Current time updates every second. Demo heartbeat is refreshed only while connected. A resumed active demo task uses elapsed wall-clock time, even if the app was closed; this is not a deadman safety mechanism.

Mission history is capped at 200 and events at 60. AsyncStorage writes are serialized so older asynchronous saves cannot overwrite more recent commands. Corrupt/unavailable storage produces a warning and usable demo state rather than a crash.

## Live Transport Requirements

- Public build-time URL selects the HTTP service; empty URL selects simulation.
- Poll every two seconds on native and web.
- Validate robots/tasks with Zod. No simulated fallback after live failure.
- Heartbeat is authoritative robot telemetry. Older-than-ten-second or implausibly future timestamps block dispatch.
- Requests time out at eight seconds.
- No automatic mutation retry.
- Accepted task IDs are retained before follow-up snapshots.
- Ambiguous creation response locks dispatch for the current session; the operator must reconcile backend state before restarting.
- Cancellation requires final backend acknowledgment.
- Live history only covers task IDs created in the session because the supplied contract lacks history/current-task routes.
- Browser SSE was replaced by portable polling. The original `/events` endpoint can remain on the server but is not required by this client.

## Accessibility and Safety

- Semantic button/link roles and readable labels.
- Disabled actions expose disabled state.
- Touch-sized navigation and command controls.
- SVG descriptions expose pose/chart information without relying on colors alone.
- Status text accompanies badges; timestamp/error text is selectable in details.
- Confirmation is required before deleting/resetting demo records.
- Native modal back-button dismissal and safe-area spacing are supported.
- Notifications/help do not grant access to real hardware.

Keyboard navigation and screen readers should be validated on final target devices. This implementation is not certified to a WCAG conformance level, industrial control standard or functional-safety standard.

## Original-App Parity and Deliberate Changes

| Original Next.js Feature                  | React Native Edition                                   |
| ----------------------------------------- | ------------------------------------------------------ |
| Five workspace tabs                       | Five routable screens/deep links                       |
| Desktop sidebar + mobile drawer           | Sidebar + persistent touch navigation                  |
| Warehouse SVG and map tools               | Native-compatible SVG with same map frame and controls |
| Dispatch/cancel/manual/scenarios          | Shared simulator and native controls                   |
| localStorage persistence                  | AsyncStorage across web and native                     |
| HTTP + browser SSE/poll fallback          | Validated portable HTTP polling                        |
| Browser CSV export                        | Browser download + native sharing                      |
| Chart styles/ranges and reporting filters | Retained with shared timestamp-derived data            |
| Search in header/ledger                   | Search in dedicated mission ledger                     |
| HTML dialogs                              | Native Modal confirmation/detail/help overlays         |

No claim is made that a physical robot, simulator backend, vendor API or certified stopping circuit has been integrated.

## Acceptance Criteria

1. Web export and Android/iOS bundle export resolve without source errors.
2. App opens on Overview with 24 labeled samples, Atlas at A, 22 completed records and 92% seeded success.
3. Normal dispatch runs and reaches B; dispatch is blocked while active.
4. Cancel stops simulated motion permanently for that task.
5. Obstacle pauses/recoveries and timeout failures are visible.
6. Disconnect fails active work; reconnect does not resume it.
7. Manual control moves in bounds and blocks autonomous dispatch.
8. Search/filter/page/details/CSV work and persistence survives reload.
9. Chart and reporting controls update timestamp-derived values.
10. Reset requires confirmation; help/events open and dismiss.
11. Desktop and phone-browser layouts avoid horizontal viewport overflow; navigation targets are >=44 x 44.
12. Invalid/missing/stale API state never dispatches and never becomes fake success.
13. Signed native builds must additionally pass device installation, sharing and lifecycle tests before native release.

See `DELIVERY_STATUS.md` for which criteria have been executed and which credential/device-dependent validation remains.
