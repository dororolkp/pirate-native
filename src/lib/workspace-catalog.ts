export type WorkspaceRoute =
  | "/"
  | "/robots"
  | "/missions"
  | "/analytics"
  | "/logbook"
  | "/settings"
  | "/docs"
  | "/integrations";
export interface WorkspaceCommand {
  id: string;
  title: string;
  description: string;
  keywords: string;
  route?: WorkspaceRoute;
}
// Deliberately navigation/help only: no robot mutation can enter the palette.
export const WORKSPACE_COMMANDS: readonly WorkspaceCommand[] = [
  {
    id: "overview",
    title: "Open overview",
    description: "Map and robot status",
    keywords: "home fleet map",
    route: "/",
  },
  {
    id: "robots",
    title: "Open robots",
    description: "Robot controls and local driving preview",
    keywords: "robot gazebo",
    route: "/robots",
  },
  {
    id: "missions",
    title: "Open mission history",
    description: "Inspect tasks; no dispatch from this menu",
    keywords: "tasks deliveries csv",
    route: "/missions",
  },
  {
    id: "analytics",
    title: "Open fleet analytics",
    description: "Timestamp-derived mission reports",
    keywords: "charts reports",
    route: "/analytics",
  },
  {
    id: "logbook",
    title: "Open private logbook",
    description: "Device-only diagnostic events",
    keywords: "logs privacy",
    route: "/logbook",
  },
  {
    id: "settings",
    title: "Open connection settings",
    description: "Configure David's API and consent",
    keywords: "backend url api connect",
    route: "/settings",
  },
  {
    id: "docs",
    title: "Open documentation",
    description: "Searchable guides, setup and troubleshooting",
    keywords: "docs help mintlify",
    route: "/docs",
  },
  {
    id: "integrations",
    title: "Open free stack studio",
    description: "Local insights and integration capabilities",
    keywords: "stack tools privacy segment amplitude",
    route: "/integrations",
  },
  {
    id: "tour",
    title: "Start guided tour",
    description: "Highlighted explanations, never automatic commands",
    keywords: "onboarding guide help",
  },
];

export function searchCatalog<T extends { title: string }>(
  items: readonly T[],
  query: string,
): T[] {
  const words = query
    .trim()
    .toLocaleLowerCase()
    .slice(0, 120)
    .split(/\s+/)
    .filter(Boolean);
  return items.filter((item) => {
    const text = Object.values(item)
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}

export interface StackCapability {
  id: string;
  title: string;
  category: "Design" | "Privacy" | "Operations";
  reference: string;
  alternative: string;
  status: "Included" | "Optional account" | "Not connected";
  detail: string;
}
export const STACK_CAPABILITIES: readonly StackCapability[] = [
  {
    id: "platform",
    title: "Universal app + static web",
    category: "Operations",
    reference: "Next.js / React / Vercel",
    alternative: "Expo Router + React Native + Vercel",
    status: "Included",
    detail:
      "Static routes with SEO metadata, native controls and CDN assets. Vercel free-plan eligibility and quotas still apply.",
  },
  {
    id: "docs",
    title: "Searchable documentation",
    category: "Operations",
    reference: "Mintlify",
    alternative: "Self-hosted React Native docs centre",
    status: "Included",
    detail:
      "Search, topic filters and setup guides. No SaaS documentation account, build plugin or paid theme.",
  },
  {
    id: "components",
    title: "Expressive accessible controls",
    category: "Design",
    reference: "Radix UI / Tailwind CSS / shadcn/ui",
    alternative: "Native primitives + shared theme + command palette",
    status: "Included",
    detail:
      "Uiverse-inspired outlined cards, 44px controls, dialogs and keyboard search. DOM-only components are not installed.",
  },
  {
    id: "graphics",
    title: "Lightweight graphics",
    category: "Design",
    reference: "Three.js",
    alternative: "Original react-native-svg diagrams",
    status: "Included",
    detail:
      "Lazy 2D SVG illustrations and static geometry, not a 3D renderer. No WebGL canvas or remote image tracking.",
  },
  {
    id: "motion",
    title: "Considerate motion",
    category: "Design",
    reference: "GSAP / Lenis",
    alternative: "React Native Animated + native scrolling",
    status: "Included",
    detail:
      "Finite decorative animation, reduced-motion support and cleanup on background/unmount. No scroll hijacking or infinite animation loop.",
  },
  {
    id: "events",
    title: "Local product insights",
    category: "Privacy",
    reference: "Segment / RxJS / Amplitude",
    alternative: "RxJS BehaviorSubject + useSyncExternalStore",
    status: "Included",
    detail:
      "Actual RxJS subscription lifecycle; explicit opt-in and aggregate UI counters in memory only. No IDs, paths, replay, persisted events or remote analytics SDK.",
  },
  {
    id: "consent",
    title: "Clear privacy choices",
    category: "Privacy",
    reference: "OneTrust",
    alternative: "First-party consent controls",
    status: "Included",
    detail:
      "Separate local-insight and optional GA4 controls, off by default. Not a certified legal CMP or jurisdiction-specific compliance guarantee.",
  },
  {
    id: "ga4",
    title: "Optional web analytics",
    category: "Privacy",
    reference: "GA4 / Google Tag Manager / HubSpot Analytics",
    alternative: "Direct consent-gated GA4 adapter",
    status: "Optional account",
    detail:
      "Requires the owner's real measurement ID. No GTM container, ad personalization or marketing pixel is added; native apps never load Google scripts.",
  },
  {
    id: "support",
    title: "Helpful local onboarding",
    category: "Operations",
    reference: "Qualified / HubSpot / OptinMonster",
    alternative: "Local Ariel answers + guided tour + docs",
    status: "Included",
    detail:
      "Searchable help without recording conversations, sales popups, remote AI, lead collection or CRM synchronization.",
  },
  {
    id: "status",
    title: "Honest operations status",
    category: "Operations",
    reference: "Atlassian Statuspage / issue tracker",
    alternative: "Fleet health + private logbook",
    status: "Included",
    detail:
      "Current robot/API status, not a fabricated hosted-service uptime SLA. The docs link to the team's GitHub repositories.",
  },
  {
    id: "ads",
    title: "Advertising and replay",
    category: "Privacy",
    reference:
      "Meta Pixel / FullStory / Google Ads / LinkedIn / Zoominfo / Microsoft Ads / Outbrain / Twitter Ads / DoubleClick / Social Snowball",
    alternative: "Intentionally excluded",
    status: "Not connected",
    detail:
      "No ad accounts, affiliate billing, screen recording or third-party cookies. These are not necessary to operate a robot workspace.",
  },
  {
    id: "business",
    title: "Mail, CRM and signatures",
    category: "Operations",
    reference: "iCloud Mail / Google Workspace / HubSpot CRM / DocuSign",
    alternative: "Owner-managed external services",
    status: "Not connected",
    detail:
      "Mail hosting, CRM synchronization and legally binding signatures need real accounts and configuration. The app does not imitate these as connected free services.",
  },
  {
    id: "runtime",
    title: "Modern browser compatibility",
    category: "Operations",
    reference: "core-js 2",
    alternative: "Expo's supported runtime and compiler",
    status: "Included",
    detail:
      "No obsolete core-js 2 polyfill is introduced. Platform boundaries keep browser APIs out of native bundles.",
  },
];

export interface GuideArticle {
  id: string;
  title: string;
  category: "Getting started" | "Safety" | "Privacy" | "Development";
  summary: string;
  body: string;
}
export const GUIDE_ARTICLES: readonly GuideArticle[] = [
  {
    id: "first-mission",
    title: "Your first A/B mission",
    category: "Getting started",
    summary: "Connect, check idle status, send to B and return to A.",
    body: "Start in the local demo or explicitly connect David's server in Settings. Verify connected/idle status and fresh API receipt. Send to Station B deliberately; observe queued, running and completed. Send to Station A returns the robot. The guide and command palette never send commands automatically.",
  },
  {
    id: "connect",
    title: "Connect David's backend",
    category: "Getting started",
    summary: "Use a server URL, not the GitHub repository.",
    body: "Enter the base URL without /api/v1, credentials or query strings. Local development can use http://localhost:8000. A deployed HTTPS frontend needs a reachable HTTPS API and the exact origin allowed by CORS. Session-only selection resets on reload. On a phone localhost means the phone, not your computer.",
  },
  {
    id: "coordinates",
    title: "Understand map coordinates",
    category: "Safety",
    summary: "World metres, radians and configured station defaults.",
    body: "Live Station A is (-4, 0) and B is (-14, 6), matching David's config.py defaults. World +Y points up and +X right. The UI uses a uniform 20px/metre presentation scale. No scenario or occupancy-map endpoint exists yet; synchronize frontend constants with BACKEND_STATIONS before driving. Old poses retain their source timestamps.",
  },
  {
    id: "cancel",
    title: "Cancel, do not assume emergency stop",
    category: "Safety",
    summary: "Backend acknowledgment is distinct from certified stopping.",
    body: "Cancel mission targets the exact active task. The frontend requires a matching canceled backend response and never automatically retries a mutation. An unknown creation outcome locks dispatch until an operator reconciles it. Do not reload merely to bypass this safeguard. Physical emergency stopping belongs to the robot/operator.",
  },
  {
    id: "preview",
    title: "Local driving versus live navigation",
    category: "Safety",
    summary: "The driving pad remains a preview.",
    body: "Manual Left/Up/Down/Right controls are local-demo only. The separate velocity pad previews Ackermann commands but does not publish ROS or Gazebo traffic. David's server chooses mock versus Gazebo for A/B navigation. The robot API does not identify which adapter is running.",
  },
  {
    id: "privacy",
    title: "Choose analytics without surprises",
    category: "Privacy",
    summary: "Local counters and GA4 are independent, opt-in choices.",
    body: "Free stack studio offers in-memory aggregate UI counters. They reset on reload and are erased when disabled. They contain no robot IDs, coordinates, API URLs, searches, paths or timestamps. Optional GA4 remains web-only, consent-gated and measurement-ID dependent. No ad pixels, session replay, CRM or chat SDK is installed.",
  },
  {
    id: "logbook",
    title: "Mission history versus private logbook",
    category: "Privacy",
    summary: "Backend tasks are different from device diagnostics.",
    body: "Missions loads the newest 200 backend tasks, including other-client work. Search, status filters, Details and CSV operate on those records. Logbook holds fixed-code local diagnostics for seven days, capped at 200 entries. Clearing logbook never deletes backend missions. Both exports remain operator-controlled.",
  },
  {
    id: "tools",
    title: "Use workspace tools and keyboard search",
    category: "Getting started",
    summary: "Open the command palette with its button or Ctrl/Cmd+K.",
    body: "Workspace tools opens a searchable navigation menu. Search by backend, docs, history or privacy; Arrow Up/Down selects and Enter opens. Escape closes the menu. Keyboard shortcuts ignore text-editing fields while the menu is closed. Commands are restricted to navigation and starting the tour.",
  },
  {
    id: "development",
    title: "Build and test the universal app",
    category: "Development",
    summary: "Expo 58, Node 24 and tested module boundaries.",
    body: "Use npm ci, npm run lint, npm run typecheck, npm test and npm run build:web. npm run build:bundles exports web/Android/iOS bundles, not signed APK/IPA files. Native signing needs Expo/EAS credentials. Browser integrations live in .web files; pure catalogues and event stores are independently tested.",
  },
  {
    id: "network",
    title: "Troubleshoot an unavailable API",
    category: "Development",
    summary: "Check health, HTTPS, CORS and robot connectivity.",
    body: "Verify the backend /health endpoint, URL and exact browser origin. A reachable API does not prove the robot is connected. Robot/current-task reads poll at 500ms, history at five seconds; failures back off up to 30 seconds, or 60 for Retry-After. Offline or unavailable telemetry blocks dispatch and never silently becomes demo data.",
  },
];
