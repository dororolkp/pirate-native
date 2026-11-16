import type { Metadata } from "expo-router/server";

export const SITE_ROUTES: Record<string, [string, string]> = {
  "/": [
    "Fleet Overview",
    "Explore Pirate fleet missions and the Gazebo driving laboratory. Safe local simulation with backend integration prepared.",
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
    "Review idle Gazebo integration, simulation scenarios and privacy choices.",
  ],
  "/logbook": [
    "Local Operational Logbook",
    "Review, filter, export or clear private diagnostic events saved only on this device.",
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
      index: path !== "/settings" && path !== "/logbook" && known,
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
      "A local fleet simulation and Gazebo command-preview workspace. Backend robot control is not enabled.",
    isAccessibleForFree: true,
  };
}
