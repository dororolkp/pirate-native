# Free-First Universal Frontend

The requested commercial website stack is a reference, not a dependency checklist. This release stays on Expo 58, React Native 0.88 and Expo Router, sharing native views and domain logic across web, iOS and Android. RxJS 7.8.2 is installed for the opt-in local aggregate store; UI remains shared native primitives.

## Included Features

| Reference                               | Implemented equivalent                                         | Boundary                                              |
| --------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Next.js / Vercel                        | Expo Router static export, metadata, sitemap and Vercel CDN    | Hosting eligibility and quotas apply                  |
| Mintlify                                | `/docs`: searchable articles, topic filters, expandable guides | Self-hosted content, no hosted search                 |
| Radix / Tailwind / shadcn/ui            | Shared native buttons, dialogs, theme and command palette      | No DOM-only framework installed                       |
| Three.js                                | Original lightweight SVG maps and illustrations                | 2D, not a 3D renderer                                 |
| GSAP / Lenis                            | Finite Animated decoration and platform scrolling              | Reduced-motion support, no scroll replacement         |
| RxJS / Segment / Amplitude              | Actual RxJS BehaviorSubject and `useSyncExternalStore`         | Aggregate counters only, no remote analytics pipeline |
| OneTrust                                | Explicit first-party privacy choices                           | Not a certified CMP or legal-compliance guarantee     |
| Qualified / OptinMonster / HubSpot help | Ariel, searchable docs and highlighted guide                   | No remote chat, lead capture or CRM sync              |
| Statuspage                              | Fleet/API health and private logbook                           | Not an independently monitored hosted uptime service  |
| core-js 2                               | Expo-supported runtime/compiler                                | No obsolete polyfill introduced                       |

GA4 remains optional, web-only and consent-gated. A real owner-managed measurement ID is required. There is no GTM container or HubSpot analytics integration.

Mail hosting, Google Workspace, iCloud Mail, DocuSign, CRM synchronization, advertising pixels, FullStory replay, affiliate programs and conversion accounts are **not connected**. They require accounts, configuration, provider terms and a separate privacy/security decision. The app does not represent a local substitute as a working external service.

## Using the New Tools

1. Open **Workspace tools** in the header. On web, Ctrl/Cmd+K also opens it unless a text-editing field has focus.
2. Search by backend, docs, history or privacy. Arrow Up/Down selects; Enter opens; Escape closes.
3. These commands only navigate or start the guide. They never dispatch, cancel or publish robot commands.
4. Open **Documentation** for ten searchable guides. Combine keyword search with topics, expand an article, or clear the filters. Search is bounded to 120 characters and never transmitted or tracked.
5. Open **Free stack studio** to see actual integration status and optional local insights.

The main six mobile navigation destinations remain unchanged. Header tools and Help links expose the new routes without crowding the phone navigation.

## Scrolling and Button Behavior

The workspace has one bounded page scroller containing its header, guide and content. On taller screens the header sticks; on short screens it scrolls away to preserve usable content height. The desktop sidebar scrolls independently. During an active tour, **View current guide** returns to the guide without restarting it; on short screens scroll back to the top to reach that control.

Dialogs keep the close control outside their scrollable body, fit short/landscape viewports and use keyboard avoidance on native. Palette arrows scroll the selected result into view. Read/Close article buttons, mission details, destination selection, Help and Notifications use the same responsive boundaries. Native keyboard avoidance still requires device QA.

Prerendered buttons are disabled and search fields are read-only until the client mounts, so early interaction cannot disappear during hydration. Toggle buttons expose `aria-pressed`; expanded articles expose `aria-expanded`. Web content wraps long identifiers and uses the dynamic viewport height.

## Local Insights Privacy

Local insights start disabled. Enable explicitly in `/integrations` to count only `help_opened`, `mission_history_exported` and `chart_style_changed`.

- Counts stay in memory, capped at 999 per action.
- No user/session IDs, timestamps, URLs, searches, poses, commands or event history are stored.
- Clear resets counters while leaving the feature enabled.
- Disable clears counters; reload starts disabled and empty.
- This preference is not saved in AsyncStorage, cookies or browser storage.
- Enabling local insights does not grant GA4 consent or load Google scripts.
- Native can count local actions but never loads browser analytics.
- `/integrations` is noindex and is excluded from remote page tracking and the sitemap.

This is a small private diagnostic feature, not equivalent to a multi-user analytics dashboard, consent certification or marketing attribution platform.

## Module Design

| Module                         | Responsibility                                                          |
| ------------------------------ | ----------------------------------------------------------------------- |
| `src/lib/workspace-catalog.ts` | Pure content, capability status, safe route catalogue and search        |
| `src/lib/product-insights.ts`  | RxJS current-value subject, immutable bounded snapshots and unsubscribe |
| `use-catalog-search`           | Query/topic state and reset                                             |
| `use-product-insights`         | Shared store subscription with empty server snapshot                    |
| `use-workspace-tools`          | Palette state, bounded selection and safe navigation                    |
| `use-command-shortcut.web`     | Browser shortcuts and listener cleanup                                  |
| `use-command-shortcut`         | Native adapter with no browser dependency                               |
| `use-entrance-motion`          | Stable Animated value, finite motion, accessibility/background cleanup  |
| `Dialog`                       | Shared accessible modal boundary                                        |
| `use-client-ready`             | Disabled server controls; interaction only after hydration              |
| Route components               | Documentation/stack layouts, no fleet mutation logic                    |

The existing fleet provider, backend adapter and task safety rules remain separate. This is still a modular monolith, not multiple service deployments.

## Design Sources and Verification

Free [Uiverse offset-card patterns](https://uiverse.io/0xnihilism/thin-crab-36) and the [shadcn command-menu reference](https://ui.shadcn.com/docs/components/command) informed the interaction design. The implementation uses original React Native layouts and geometry, not copied DOM widgets. See [credits](../THIRD_PARTY_NOTICES.md).

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build:web
npm run test:e2e
npm run build:bundles
npx expo-doctor
npm audit
```

Unit tests cover search, immutability, bounds, RxJS unsubscribe, opt-in/reset, server privacy, hydration readiness, keyboard lifecycle, safe palette actions and motion cleanup. Browser tests cover routes, keyboard navigation, no robot POSTs, local insight lifecycle, absent unsolicited trackers, 320px layout, sitemap and noindex metadata. `layout-overflow.spec.ts` also checks 320x480, 740x320 and 1440x600 page/guide height, independent sidebar scrolling, dialog overflow, palette result visibility and controls after expansion/selection. Native bundle export is not device QA or a signed APK/IPA.

Local layout-fix verification: 200 unit tests and 72 desktop/mobile browser tests passed. Two real-backend tests remain opt-in and were skipped. Lint, typecheck, Expo Doctor (20/20), audit (zero vulnerabilities), and isolated clean installation also passed. This records local verification, not publication of the changes to production.
