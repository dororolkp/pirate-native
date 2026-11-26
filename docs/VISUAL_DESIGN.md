# Visual Design and Delivery

## Direction

A maximalist robotics studio: electric violet, pink, lime, teal and yellow; oversized typography; thick ink outlines; offset shadows; asymmetric card corners; and original starburst geometry. The cream dotted canvas and expressive hero frame the mission controls without changing their behavior. Uiverse's free MIT patterns inspired the card framing and diagonal interaction sheen; see [credits and license](../THIRD_PARTY_NOTICES.md). Safety/status copy stays explicit. Decorative motion never indicates robot movement, command acceptance or backend connectivity.

Pure palette tokens live in `src/lib/theme.ts`, with compatibility re-exports from the shared UI module. `MaximalistPattern` is memoized static SVG geometry, hidden from assistive technology and pointer input. Shared buttons, panels, navigation, metric cards and dialogs use the same outlined visual language. Gradients and dotted backgrounds are web-only enhancements; native layouts retain solid colors and shared geometry.

## Module Boundaries

`SimulationHero` owns shared native layout and copy. `HeroArt` is a platform adapter:

- Web: waits until within 120px of the viewport before importing `hero-scene.web`. The vector and its animation styles are loaded together through React lazy/Suspense. An IntersectionObserver-free browser still loads the illustration.
- Native: mounts vector art on container layout, with no browser imports or animation timers. Metro may keep the dependency in the native binary; this is deferred rendering, not a claim of native network code splitting.
- `VisualBoundary` isolates a failed decorative chunk. Stable container dimensions avoid layout jumps. The fallback is intentional geometry and truthful status text, not a placeholder photograph. Mission controls stay outside the boundary.

The components use existing React/React Native/SVG capabilities. No additional animation runtime, npm dependencies or network image provider is required. The original vector illustration stays sharp at phone and desktop sizes.

## Motion and Accessibility

The web scene reveals once in 650ms; geometric accents drift once for 3.8 seconds. They are not endless animation loops. CSS respects `prefers-reduced-motion`, and hidden browser tabs pause animations. Decorative spans are hidden from assistive technology; the vector keeps its descriptive, non-telemetry accessible label. Buttons retain 44px minimum targets, visible focus and disabled state. Destructive buttons do not get the sheen effect.

## CDN and Load Distribution

Vercel delivers the exported site through its [managed CDN](https://vercel.com/docs/cdn). Content-hashed files under `/_expo/static/`, including deferred JavaScript chunks, already use a one-year immutable cache. HTML remains revalidated so releases do not leave stale document/chunk references in browser caches.

This reduces repeated origin delivery and distributes static requests through the hosting provider's edge infrastructure. It is **not** a newly configured backend load-balancer cluster, failover arrangement, or proof of traffic capacity. Live robot tasks require an explicitly configured backend; demo remains the default. There are no third-party image hotlinks, per-user generation calls, API keys or external animation-CDN outages in the rendered workspace.

Vercel's free/Hobby offering is subject to current usage and eligibility limits; it is not unlimited free infrastructure. Check the provider's current terms before commercial production or sustained heavy traffic. Backend scaling, authenticated gateway replicas, control leases and load tests belong to a separate backend release.

## Verification

The free-stack upgrade adds colorful documentation/capability cards and a shared banner. Only its original decorative starburst gets a 280ms Animated entrance; content stays readable during server rendering. Reduced-motion changes, backgrounding and unmount stop/settle the animation. React Native Web lacks the native `useAnimatedValue` export, so the shared hook uses a stable `Animated.Value` initializer instead. The command palette and extracted dialog keep navigation/help separate from robot mutations. See [Free-First Stack](FREE_STACK.md).

`tests/unit/hero-art.test.ts` checks lazy visibility gating, observer fallback/cleanup, server rendering and failed-art isolation. Native layout gating has a separate component test. Browser tests verify deferred chunk delivery, the failed-chunk fallback, reduced motion, hidden-tab state, responsive overflow and the SVG accessible label. Existing fleet/mission/privacy tests remain the regression baseline.

The maximalist release passed lint, typechecking, 144 unit tests, 38 browser tests and all 20 Expo Doctor checks. Palette tests verify WCAG AA 4.5:1 contrast for body/muted text on the shared cream and colorful surfaces, plus hero and selected-button text. Browser regression coverage includes every route at 320px, help dialog dismissal, dispatch/cancel and horizontal overflow. Production web and Android/iOS Hermes bundle exports succeeded.

```bash
npm run check
npm run test:e2e
npm run build:bundles
```

Native bundle exports are not physical-device rendering tests or signed APK/AAB/IPA releases. Runtime native QA remains required before store delivery.

## Dependency Audit

The 22 November 2026 maximalist release audit reports **zero vulnerabilities** without dependency changes or audit exclusions. The registry has reconciled the earlier withdrawn finding described below.

On 18 November 2026, npm audit reported 43 high-severity affected dependency entries, all cascading from picomatch advisory [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). GitHub's advisory API confirmed `withdrawn_at: 2026-11-18T15:38:56Z`, while npm still included it in its response. That earlier release did not claim a zero-warning audit, and its CI audit step failed. No blanket exclusions, forced Expo downgrades or audit-gate removal were applied. Inspect future findings independently rather than assuming they share this historical cause.

Expo, Expo Router and Expo FileSystem were updated to the SDK-compatible patch versions recommended by Expo Doctor. The lockfile was regenerated in a clean temporary directory and checked for Linux x64 and Windows x64 install portability.
