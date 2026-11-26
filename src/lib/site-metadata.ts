import type { Metadata } from "expo-router/server";

export const SITE_ROUTES: Record<string, [string, string]> = {
  "/": [
    "Fleet Overview",
    "Explore Pirate fleet missions, David's robot API and the Gazebo driving laboratory. Safe local demo by default.",
  ],
  "/robots": [
    "Gazebo Driving Lab",
    "Preview blue hatchback Ackermann controls for Gazebo Harmonic. Inspect robot status and explore local mission simulation.",
  ],
  "/missions": [
    "Mission Center",
    "Plan and inspect simulated warehouse deliveries, filter mission outcomes and export history.",
  ],
  "/analytics": [
    "Fleet Analytics",
    "Explore local mission completion, performance and timestamp-derived fleet insights.",
  ],
  "/settings": [
    "Workspace Settings",
    "Connect David's robot API, review local simulation scenarios and manage optional privacy choices.",
  ],
  "/logbook": [
    "Local Operational Logbook",
    "Review, filter, export or clear private diagnostic events saved only on this device.",
  ],
  "/docs": [
    "Documentation",
    "Search free React Native workspace guides for API setup, mission controls, safety, privacy and development.",
  ],
  "/integrations": [
    "Free Stack Studio",
    "Explore free React Native tools, opt-in device-only product insights and honest integration capabilities.",
  ],
};

export function pageMetadata(path: string): Metadata {
  const known = Object.hasOwn(SITE_ROUTES, path);
  const [name, description] = known ? SITE_ROUTES[path] : SITE_ROUTES["/"];
  const title = `${name} | Pirate`;
  const url = `https://pirate-native.vercel.app${known ? path : "/"}`;
  return {
    title,
    description,
    applicationName: "Pirate",
    robots: {
      index:
        path !== "/settings" &&
        path !== "/logbook" &&
        path !== "/integrations" &&
        known,
      follow: true,
    },
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Pirate", type: "website" },
    twitter: { card: "summary", title, description },
    other: { "theme-color": "#443c91", "color-scheme": "light" },
  };
}

export function siteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pirate",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web, iOS, Android",
    url: "https://pirate-native.vercel.app/",
    description:
      "A React Native fleet workspace with optional API integration and free documentation. Backend robot control is not enabled by default.",
    isAccessibleForFree: true,
  };
}
