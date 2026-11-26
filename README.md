# Pirate Native

**Fleet & mission control for things that move.**

An Expo + React Native application for **web, iOS, and Android**, using native views, shared domain logic, SVG maps/charts, and Expo Router. Felix's robotics MVP connects [David's ROS backend](https://github.com/davidcheungo123/ros_backend) for one robot and Station A/B navigation. No Next.js migration is required.

- Repository: https://github.com/dororolkp/pirate-native
- Website: https://pirate-native.vercel.app
- Original application: https://github.com/dororolkp/pirate
- Source reference: `C:\Users\leekw\Documents\startup project\pirate`, commit `d5b4f30`.

> Safe simulation is the default. No physical robot is controlled. Demo cancel/stop buttons are not certified emergency stops. A configured API never falls back to simulated success.

## Gazebo Driving Lab

The Robots screen includes colorful Gazebo Harmonic driving previews based on [painpongpoint/Gazebo-Simulator](https://github.com/painpongpoint/Gazebo-Simulator). That pad remains a **local command preview**, not live teleoperation. Separately, **Settings -> Connect backend** enables David's REST A/B tasks, robot telemetry and mission history. His backend selects mock versus Gazebo; the app does not publish ROS commands directly.

Select **Start guided tour** in the header for highlighted, step-by-step explanations across all screens. Read [Felix's Frontend Guide](docs/FRONTEND_GUIDE.md) for setup, a team-demo workflow and a complete button reference, and [ROS Backend Integration](docs/ROS_BACKEND_INTEGRATION.md) for verified payloads and map conversion.

Ariel provides curated local guidance, not a remote AI service. The modular monolith keeps simulator domain rules, UI, fleet transport and web infrastructure separate inside one app and release unit.

Web now exports static route HTML with titles, canonical/Open Graph/Twitter metadata, sitemap, English language and keyboard-focus support. Optional Google Analytics 4 is web-only, unconfigured without a real `EXPO_PUBLIC_GA_MEASUREMENT_ID`, and off until explicit opt-in in Settings. Disable GA Enhanced Measurement before enabling the integration.

Read [Gazebo Integration and Architecture](docs/GAZEBO_INTEGRATION.md) for verified source settings, proposed backend contracts, safety boundaries, accessibility and privacy configuration.

## Professional Readiness Upgrade

Operations status, a responsive six-destination workspace, clearer content and keyboard skip navigation now accompany the driving lab. **Logbook** provides filtered, exportable, seven-day local history with clear/disable controls. It never uploads robot data or its records.

Live reads use bounded outage backoff and pause while backgrounded; demo commands still save immediately while routine disk writes are throttled. Optional GA4 supports only public page views and fixed help/chart/export events after consent; Settings and Logbook are excluded.

The modular-monolith boundaries and tested future SQLite migration are documented in [Production Readiness](docs/PRODUCTION_READINESS.md). SQL is not connected to the client or a running backend. Use `npm run test:sql` to validate it, and `npm run test:hooks` to check all hook modules.

## Free-First Workspace Tools

**Workspace tools** adds safe searchable navigation with Ctrl/Cmd+K on web. `/docs` provides a colorful searchable documentation centre; `/integrations` explains the actual free-stack capabilities and offers optional in-memory product-insight counters. These features use existing React Native primitives, shared hooks and original Uiverse-inspired geometry, without Next.js or new SDK dependencies.

Local insights are off by default, aggregate only three allowlisted UI actions, and clear on disable/reload. They do not enable GA4. CRM, mail hosting, signatures, marketing pixels and session replay are not connected or represented as free integrations. See [Free-First Stack Guide](docs/FREE_STACK.md) for the full technology mapping, usage, privacy and module design.

## Delivery Status

Web production export and web/iOS/Android JavaScript bundles can be built in this repository. **Exported native bundles are not APK, AAB, IPA, or installable apps.** Signed native builds and store releases need an authenticated Expo account and platform signing/store credentials. See [Delivery Status](docs/DELIVERY_STATUS.md) for verified results and outstanding work.

GitHub write-access invitations were sent to **DavidCheungo123** and **PainPongPoint**. Each person must accept their invitation before access becomes active. Acme Warehouse and Felix inside the app are demo labels, not user accounts.

## Required Tools

| Tool                                | Requirement                                              | Purpose                              |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| Node.js                             | **24.x LTS**, tested with 24.12.0                        | JavaScript runtime; includes npm     |
| npm                                 | Tested with 11.6.2                                       | Reproducible installs with `npm ci`  |
| Git                                 | Current stable                                           | Clone, branch, commit, push          |
| Browser                             | Current Chrome, Edge, Safari, or Firefox                 | Web app                              |
| Expo Go                             | SDK **58** compatible release                            | Quick native demo on a device        |
| Expo account + EAS CLI              | Account required for cloud native builds                 | Build APK/AAB/IPA without local SDKs |
| Android Studio + JDK                | Optional; required for local native Android builds       | Emulator, Android SDK/Gradle         |
| macOS + Xcode                       | Optional for cloud builds; required for local iOS builds | iOS simulator and local signing      |
| Apple Developer / App Store Connect | Required for signed device distribution/TestFlight/store | Apple signing and submission         |
| Google Play Console                 | Required only for Play Store publishing                  | Android store release                |
| Vercel account                      | Required for website deployment                          | Static web hosting                   |

Install Node from https://nodejs.org, Git from https://git-scm.com, Android Studio from https://developer.android.com/studio, and Xcode through the Mac App Store. Expo documentation lists SDK 58 minimums as Android 7+, iOS 16.4+, Xcode 26.4+, compile SDK 37 and target SDK 36. Cloud EAS images manage these SDK requirements; confirm current store requirements before submitting.

No Next.js, Flutter, ROS, Gazebo, database, backend, global `expo-cli`, or paid account is needed to run the local web simulation. Cloud build quotas and store memberships are subject to their providers' terms.

## Install and Run

The commands below work in PowerShell and standard Unix shells. In PowerShell use `npm.cmd`/`npx.cmd` if local execution policy blocks `.ps1` shims.

```bash
git clone https://github.com/dororolkp/pirate-native.git
cd pirate-native
npm ci
npm run web
```

Open the URL printed by Expo, usually http://localhost:8081. `npm ci` installs the exact dependency graph from `package-lock.json`; do not replace it with ad-hoc version upgrades.

```bash
# Start Metro and display a QR code for a physical device.
npm start

# Launch an installed Android emulator.
npm run android

# Launch an iOS simulator; requires macOS and Xcode.
npm run ios

# If the phone cannot reach the computer over LAN:
npx expo start --tunnel
```

Computer and phone normally need the same reachable network. Scan with Expo Go on Android, or the Camera app on iOS. If Expo Go does not support SDK 58 or a module, use a development build; see the deployment guide. Backgrounding clears demo manual mode. The app is not a background robot controller.

## Production Web Build

```bash
# Export a deployable website to dist/.
npm run build:web

# Serve static HTML routes using clean URLs.
npm run preview:web
```

Open http://localhost:8081. Stop Metro first if it is using the same port. The static website does not need a Node server in production. Routes `/`, `/robots`, `/missions`, `/analytics`, `/logbook`, `/settings`, `/docs` and `/integrations` share one Expo application.

## Native Builds

```bash
# Validate web, Android and iOS bundles; not installable binaries.
npm run build:bundles

# Log in and register the app with your Expo account.
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure

# Installable internal Android APK.
npm run build:android

# iOS Simulator app; no device signing, runs only on macOS Simulator.
npx eas-cli@latest build --platform ios --profile preview

# Store-signed Android AAB and iOS IPA.
npx eas-cli@latest build --platform all --profile production
```

The initial `eas init` writes the actual EAS project ID into app configuration. The repository does not invent that ID or include credentials. Android package and iOS bundle identifier are `com.dororolkp.pirate`; confirm ownership/availability before creating store records. [Build and Deployment](docs/BUILD_AND_DEPLOY.md) explains signing, development builds, submission, rollback, and local SDK setup.

## Use the App

1. **Overview:** Atlas starts at Station A. Review mission counts, warehouse pose, activity chart and performance. The initial 24 mission records are explicitly simulated examples.
2. **Dispatch:** Use **Send to Station B** or **New mission**. Normal delivery moves through queued -> running -> completed in about 19 seconds.
3. **Robots:** Cancel active work or stop the simulation. Enable manual control only while idle; directional buttons move by bounded demo map steps. Disable manual control before autonomous dispatch.
4. **Settings:** Choose obstacle recovery (four-second pause) or navigation timeout (failure after 15 seconds). Disconnect during work to see failure; reconnect does not resume failed tasks.
5. **Missions:** Search by task, robot, destination or status; filter, paginate, inspect timestamps and task events, and export matching records as CSV. Web downloads a file; native opens the share sheet.
6. **Analytics:** Switch bar/line charts, 8-hour/24-hour/7-day ranges, and the shared reporting period. Metrics come from mission timestamps, not invented trends.
7. **Reset:** Settings -> Reset demo data -> Confirm reset. This clears local demo history and restores the examples. Cancel the confirmation to retain your data.

Demo state persists using AsyncStorage (browser storage on web), capped at 200 missions and 60 events. Manual mode does not restore after reload. Active demo work resumes from elapsed wall-clock time; this behavior is deliberately not a physical deadman guarantee.

## Connect the Backend

Copy `.env.example` to `.env.local` and edit public, non-secret configuration:

```dotenv
EXPO_PUBLIC_API_BASE_URL=https://your-approved-backend.example
EXPO_PUBLIC_ROBOT_ID=robot_01
```

Use an empty API URL for the demo. Restart Metro with `npx expo start --clear`, or rebuild/deploy after changing build-time values. `EXPO_PUBLIC_*` values are compiled into the client and are **not secrets**. Alternatively, enter a validated base URL in Settings for the current session; that selection is not saved or tracked.

Healthy native and web connections poll robot/active task state every 500ms and recent history every five seconds. Zod validates David's schemas; connected/idle state, transport health and recent API receipt gate dispatch. Source pose-update timestamps are preserved rather than fabricated as idle heartbeats. Failed reads back off up to 30 seconds (60 for Retry-After); polling pauses in background. Requests have an eight-second deadline. Commands never retry automatically; ambiguous creation replies lock dispatch pending operator reconciliation. Cancellation requires the matching task's canceled response.

Use HTTPS for deployed/mobile integrations with approved CORS origins. A phone's `localhost` is the phone, not your computer. David's repository does not provide a hosted API URL or an authentication protocol; do not publish real robot controls without authentication, authorization, network isolation and robot-side stopping. Live history loads up to 200 backend tasks, including other-client work. Live manual teleoperation is intentionally unavailable. The map uses David's configured metre stations; no scenario API is currently published.

See [ROS Backend Integration](docs/ROS_BACKEND_INTEGRATION.md) for current payloads, CORS, emulator addresses, adapter responsibilities, tests and limitations.

## Tests and Maintenance

```bash
# ESLint, TypeScript, unit/adapter tests, production web export.
npm run check

# Run only the React hook/provider behavior tests.
npm run test:hooks

# Install Chromium once and run desktop + phone-browser acceptance tests.
npx playwright install chromium
npm run test:e2e

# SDK compatibility and package security.
npx expo-doctor
npm audit

# Format code/docs; regenerate branded icons after changing the generator.
npm run format
npm run generate:icons
```

Browser tests run against the production export in demo mode. Stop another server on port 8081 before testing, or set `TEST_BASE_URL` to a running preview. Traces and QA screenshots are written to your OS temporary directory. TypeScript 6/Vitest assertion types need a larger Node stack here; `typecheck` supplies it and still checks source and tests.

New browser coverage checks the full highlighted workflow without POST commands, David's intercepted API payloads, failure handling and 320px guide usability. `backend-live.spec.ts` is opt-in through `LIVE_BACKEND_TEST_URL` and only for an isolated mock server; it deliberately sends real REST tasks. See the integration guide before running it.

Hook tests use Vitest, React Testing Library and jsdom with mocked React Native APIs and fleet services. `use-fleet.test.ts` covers the internal controller through `FleetProvider` and `useFleet`: service selection, telemetry/clock updates, command forwarding and notices, pending-command exclusivity, errors/recovery, AppState behavior, shared context and unmount cleanup. `use-layout-width.test.ts` covers browser resizing, iOS/Android dimension selection, static HTML hydration and subscription cleanup including Strict Mode. `use-logbook.test.ts` checks local-store hydration, updates, cleanup and private server-rendering boundaries. These exercise real React lifecycles, not physical devices or a live backend; service implementations are covered separately by adapter/domain tests. `npm test` and CI include the hook tests automatically.

Scoped npm overrides replace vulnerable `minimatch` transitive versions for Expo fingerprinting and TypeScript ESLint with 11.0.8+. Do not use `npm audit fix --force`: its suggested Expo downgrade would break SDK compatibility. Review overrides when upgrading Expo.

## Documentation and Architecture

The Uiverse-inspired visual system uses original vector artwork, deferred web illustration/animation chunks and reduced-motion support. See [Visual Design and CDN Delivery](docs/VISUAL_DESIGN.md) and [third-party credits](THIRD_PARTY_NOTICES.md). No remote image hotlinks or additional animation library is needed.

| Document                                                   | Contents                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| [Site Specification](docs/SITE_SPEC.md)                    | Screens, visual tokens, state model, parity, acceptance criteria |
| [Build and Deployment](docs/BUILD_AND_DEPLOY.md)           | Detailed commands, SDK setup, Vercel, EAS, stores, team access   |
| [API Contract](docs/API_CONTRACT.md)                       | Payload schemas, errors, networking, safety boundaries           |
| [Frontend Guide](docs/FRONTEND_GUIDE.md)                   | Felix's setup, highlighted workflow and every control's purpose  |
| [ROS Backend Integration](docs/ROS_BACKEND_INTEGRATION.md) | David's current API, metre conversion, history and safety        |
| [Gazebo Integration](docs/GAZEBO_INTEGRATION.md)           | Idle driving lab, proposed gateway, modular monolith, SEO/GA4    |
| [Delivery Status](docs/DELIVERY_STATUS.md)                 | Actual delivery evidence and remaining credential-dependent work |

`src/app/` contains Expo Router routes. `src/components/` implements responsive native UI. `src/hooks/use-fleet.tsx` owns one shared fleet session across routes. `src/lib/` contains domain rules, simulator, asynchronous persistence, HTTP adapter and platform-specific CSV export. Tests cover domain, transport, persistence and rendered web interaction.

CI validates Windows/Linux installs and runs browser acceptance tests on Linux. Vercel's Git integration builds production on the default branch and previews for pull requests. Native publishing is deliberately not automatic or triggered by untrusted pull requests.

The supplied Expo scaffold retains its MIT license. Product behavior/domain concepts are adapted from the user's supplied Pirate repository; confirm source ownership and distribution rights before third-party commercial redistribution.
